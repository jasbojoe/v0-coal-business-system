-- Function to reserve stock when order is created
CREATE OR REPLACE FUNCTION reserve_stock_for_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_available integer;
BEGIN
  -- Loop through all items in the order
  FOR v_item IN 
    SELECT product_id, quantity, id as order_item_id
    FROM order_items
    WHERE order_id = p_order_id
  LOOP
    -- Get current stock and reserved quantity
    SELECT 
      COALESCE(stock_quantity, 0) - COALESCE(reserved_quantity, 0) as available
    INTO v_available
    FROM products
    WHERE id = v_item.product_id;

    -- Determine fulfilled and backorder quantities
    IF v_available >= v_item.quantity THEN
      -- Full quantity available
      UPDATE order_items
      SET 
        fulfilled_quantity = 0,
        backorder_quantity = v_item.quantity
      WHERE id = v_item.order_item_id;

      -- Reserve the stock
      UPDATE products
      SET reserved_quantity = COALESCE(reserved_quantity, 0) + v_item.quantity
      WHERE id = v_item.product_id;

    ELSIF v_available > 0 THEN
      -- Partial stock available
      UPDATE order_items
      SET 
        fulfilled_quantity = 0,
        backorder_quantity = v_item.quantity
      WHERE id = v_item.order_item_id;

      -- Reserve available stock
      UPDATE products
      SET reserved_quantity = COALESCE(reserved_quantity, 0) + v_available
      WHERE id = v_item.product_id;

    ELSE
      -- No stock available - all backorder
      UPDATE order_items
      SET 
        fulfilled_quantity = 0,
        backorder_quantity = v_item.quantity
      WHERE id = v_item.order_item_id;
    END IF;

    -- Log inventory transaction for reservation
    INSERT INTO inventory_transactions (
      transaction_type,
      product_id,
      quantity,
      reference_type,
      reference_id,
      notes
    ) VALUES (
      'reserved',
      v_item.product_id,
      -v_item.quantity,
      'order',
      p_order_id,
      'Stock reserved for order'
    );
  END LOOP;

  -- Mark order as stock reserved
  UPDATE orders
  SET stock_deducted = false
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fulfill order item (deduct from stock)
CREATE OR REPLACE FUNCTION fulfill_order_item(
  p_order_item_id uuid,
  p_fulfill_qty integer
)
RETURNS void AS $$
DECLARE
  v_product_id uuid;
  v_order_id uuid;
  v_backorder_qty integer;
  v_current_reserved integer;
BEGIN
  -- Get order item details
  SELECT product_id, order_id, backorder_quantity
  INTO v_product_id, v_order_id, v_backorder_qty
  FROM order_items
  WHERE id = p_order_item_id;

  -- Validate fulfill quantity
  IF p_fulfill_qty <= 0 OR p_fulfill_qty > v_backorder_qty THEN
    RAISE EXCEPTION 'Invalid fulfill quantity';
  END IF;

  -- Get current reserved quantity
  SELECT COALESCE(reserved_quantity, 0)
  INTO v_current_reserved
  FROM products
  WHERE id = v_product_id;

  -- Deduct from stock and reserved
  UPDATE products
  SET 
    stock_quantity = stock_quantity - p_fulfill_qty,
    reserved_quantity = GREATEST(0, reserved_quantity - p_fulfill_qty)
  WHERE id = v_product_id;

  -- Update order item
  UPDATE order_items
  SET 
    fulfilled_quantity = fulfilled_quantity + p_fulfill_qty,
    backorder_quantity = backorder_quantity - p_fulfill_qty
  WHERE id = p_order_item_id;

  -- Log inventory transaction
  INSERT INTO inventory_transactions (
    transaction_type,
    product_id,
    quantity,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    'sale',
    v_product_id,
    -p_fulfill_qty,
    'order',
    v_order_id,
    'Stock fulfilled for order'
  );

  -- Check if all items are fulfilled
  DECLARE
    v_all_fulfilled boolean;
  BEGIN
    SELECT BOOL_AND(backorder_quantity = 0)
    INTO v_all_fulfilled
    FROM order_items
    WHERE order_id = v_order_id;

    IF v_all_fulfilled THEN
      UPDATE orders
      SET stock_deducted = true
      WHERE id = v_order_id;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel order (release reserved stock)
CREATE OR REPLACE FUNCTION cancel_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Loop through all items and release reserved stock
  FOR v_item IN 
    SELECT product_id, backorder_quantity
    FROM order_items
    WHERE order_id = p_order_id AND backorder_quantity > 0
  LOOP
    -- Release reserved stock
    UPDATE products
    SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - v_item.backorder_quantity)
    WHERE id = v_item.product_id;

    -- Log inventory transaction
    INSERT INTO inventory_transactions (
      transaction_type,
      product_id,
      quantity,
      reference_type,
      reference_id,
      notes
    ) VALUES (
      'cancelled',
      v_item.product_id,
      v_item.backorder_quantity,
      'order',
      p_order_id,
      'Stock released due to order cancellation'
    );
  END LOOP;

  -- Update order status
  UPDATE orders
  SET 
    status = 'cancelled',
    stock_deducted = false
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-reserve stock when order is created
CREATE OR REPLACE FUNCTION trigger_reserve_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Reserve stock after order items are inserted
  PERFORM reserve_stock_for_order(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll call reserve_stock_for_order manually from the app
-- instead of using a trigger, for better control and error handling
