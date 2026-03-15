-- Add RLS policies for payments table
-- This table was missing policies, creating security vulnerability

-- Enable RLS if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all payments
CREATE POLICY "payments_select_authenticated" ON payments
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert payments
CREATE POLICY "payments_insert_authenticated" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update payments
CREATE POLICY "payments_update_authenticated" ON payments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete payments
CREATE POLICY "payments_delete_authenticated" ON payments
  FOR DELETE TO authenticated USING (true);

-- Add RLS policies for order_reservations table
-- This table was missing policies, creating security vulnerability

-- Enable RLS if not already enabled
ALTER TABLE order_reservations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all order_reservations
CREATE POLICY "order_reservations_select_authenticated" ON order_reservations
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert order_reservations
CREATE POLICY "order_reservations_insert_authenticated" ON order_reservations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update order_reservations
CREATE POLICY "order_reservations_update_authenticated" ON order_reservations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete order_reservations
CREATE POLICY "order_reservations_delete_authenticated" ON order_reservations
  FOR DELETE TO authenticated USING (true);
