-- Seed Data for Wiyone Charcoal Business Management System

-- ============================================
-- SEED PRODUCT CATEGORIES
-- ============================================
INSERT INTO public.product_categories (name, description) VALUES
  ('Briquettes', 'Premium charcoal briquettes for grilling and cooking'),
  ('Shisha', 'Specialized charcoal for hookah and shisha'),
  ('Commercial', 'Industrial and restaurant grade charcoal'),
  ('Heating', 'Biomass pellets and heating fuel')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED PRODUCTS
-- ============================================
INSERT INTO public.products (name, description, category_id, sku, unit_price, unit, stock_quantity, min_stock_level, is_active) VALUES
  (
    'Premium Charcoal Briquettes - 5kg',
    'Our flagship product. Perfect for grilling, cooking, and heating. Burns 3x longer than regular charcoal with minimal smoke.',
    (SELECT id FROM public.product_categories WHERE name = 'Briquettes'),
    'WC-BRQ-5KG',
    25.00,
    'bag',
    500,
    50,
    true
  ),
  (
    'Premium Charcoal Briquettes - 10kg',
    'Family-sized bag of premium briquettes. Ideal for frequent grillers and restaurants.',
    (SELECT id FROM public.product_categories WHERE name = 'Briquettes'),
    'WC-BRQ-10KG',
    45.00,
    'bag',
    300,
    30,
    true
  ),
  (
    'Shisha Charcoal Cubes - 1kg',
    'Quick-lighting, odorless charcoal cubes designed specifically for hookah. Provides consistent heat.',
    (SELECT id FROM public.product_categories WHERE name = 'Shisha'),
    'WC-SHI-1KG',
    15.00,
    'box',
    200,
    20,
    true
  ),
  (
    'Shisha Charcoal Cubes - 2.5kg',
    'Bulk shisha charcoal for lounges and frequent users. Premium quality, long-lasting.',
    (SELECT id FROM public.product_categories WHERE name = 'Shisha'),
    'WC-SHI-2.5KG',
    32.00,
    'box',
    150,
    15,
    true
  ),
  (
    'Restaurant Grade Charcoal - 25kg',
    'Industrial-grade charcoal for restaurants and food businesses. Consistent quality for professional kitchens.',
    (SELECT id FROM public.product_categories WHERE name = 'Commercial'),
    'WC-RST-25KG',
    85.00,
    'bag',
    100,
    10,
    true
  ),
  (
    'Eco Fuel Pellets - 15kg',
    'Compressed biomass pellets for heating systems. Clean burning and highly efficient.',
    (SELECT id FROM public.product_categories WHERE name = 'Heating'),
    'WC-PEL-15KG',
    35.00,
    'bag',
    250,
    25,
    true
  )
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- SEED RAW MATERIALS
-- ============================================
INSERT INTO public.raw_materials (name, description, material_type, unit, quantity, min_quantity, cost_per_unit, supplier) VALUES
  ('Sawdust - Premium Grade', 'Fine sawdust from hardwood mills', 'sawdust', 'kg', 5000, 1000, 0.50, 'Freetown Timber Co.'),
  ('Coconut Shell Chips', 'Crushed coconut shells for premium briquettes', 'coconut_shell', 'kg', 3000, 500, 0.75, 'Sierra Palm Industries'),
  ('Rice Husk', 'Agricultural waste from rice processing', 'agricultural_waste', 'kg', 4000, 800, 0.30, 'Makeni Rice Mills'),
  ('Cassava Stems', 'Dried cassava plant stems', 'agricultural_waste', 'kg', 2500, 500, 0.25, 'Local Farmers Cooperative'),
  ('Wood Chips - Mixed', 'Mixed wood chips from furniture factories', 'wood_chips', 'kg', 3500, 700, 0.40, 'Freetown Furniture Ltd')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED SAMPLE CUSTOMERS
-- ============================================
INSERT INTO public.customers (name, email, phone, company_name, customer_type, address, city) VALUES
  ('Mohamed Kamara', 'mkamara@email.com', '+232 76 123 456', NULL, 'retail', '15 Siaka Stevens Street', 'Freetown'),
  ('Fatmata Restaurant', 'orders@fatmatarestaurant.com', '+232 77 234 567', 'Fatmata Restaurant & Grill', 'wholesale', '42 Lumley Beach Road', 'Freetown'),
  ('Sierra Hospitality Ltd', 'procurement@sierrahospitality.com', '+232 78 345 678', 'Sierra Hospitality Ltd', 'distributor', 'Hill Station', 'Freetown'),
  ('Abdul Trading', 'abdul.trading@email.com', '+232 76 456 789', 'Abdul Trading Company', 'wholesale', 'Wellington Industrial', 'Freetown'),
  ('Mariama Sesay', 'msesay@email.com', '+232 77 567 890', NULL, 'retail', '8 Circular Road', 'Freetown')
ON CONFLICT DO NOTHING;
