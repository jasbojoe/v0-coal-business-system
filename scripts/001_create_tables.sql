-- Wiyone Charcoal Business Management System Database Schema
-- This script creates all necessary tables for the business management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF TABLE (for employee management)
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL CHECK (department IN ('production', 'sales', 'logistics', 'administration', 'management')),
  position TEXT NOT NULL,
  salary DECIMAL(10,2),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'distributor')),
  address TEXT,
  city TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  payment_method TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RAW MATERIALS TABLE (for inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('sawdust', 'agricultural_waste', 'coconut_shell', 'wood_chips', 'other')),
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity DECIMAL(12,2) DEFAULT 0,
  min_quantity DECIMAL(12,2) DEFAULT 100,
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  supplier_contact TEXT,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTION BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.production_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity_produced INTEGER NOT NULL,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'quality_check', 'approved', 'rejected')),
  quality_notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'production', 'sale', 'adjustment', 'waste')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE SET NULL,
  quantity DECIMAL(12,2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACT INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Staff: Authenticated users can read, admins/managers can modify
CREATE POLICY "staff_select_authenticated" ON public.staff FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff_insert_authenticated" ON public.staff FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "staff_update_authenticated" ON public.staff FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff_delete_authenticated" ON public.staff FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products: Public read, authenticated write
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_authenticated" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_update_authenticated" ON public.products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "products_delete_authenticated" ON public.products FOR DELETE USING (auth.uid() IS NOT NULL);

-- Product Categories: Public read, authenticated write
CREATE POLICY "categories_select_all" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_authenticated" ON public.product_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "categories_update_authenticated" ON public.product_categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_delete_authenticated" ON public.product_categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Customers: Authenticated users only
CREATE POLICY "customers_select_authenticated" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_insert_authenticated" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_update_authenticated" ON public.customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete_authenticated" ON public.customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Orders: Authenticated users only
CREATE POLICY "orders_select_authenticated" ON public.orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_insert_authenticated" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orders_update_authenticated" ON public.orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_delete_authenticated" ON public.orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Order Items: Authenticated users only
CREATE POLICY "order_items_select_authenticated" ON public.order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_insert_authenticated" ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_update_authenticated" ON public.order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_delete_authenticated" ON public.order_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Raw Materials: Authenticated users only
CREATE POLICY "raw_materials_select_authenticated" ON public.raw_materials FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "raw_materials_insert_authenticated" ON public.raw_materials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "raw_materials_update_authenticated" ON public.raw_materials FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "raw_materials_delete_authenticated" ON public.raw_materials FOR DELETE USING (auth.uid() IS NOT NULL);

-- Production Batches: Authenticated users only
CREATE POLICY "production_batches_select_authenticated" ON public.production_batches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "production_batches_insert_authenticated" ON public.production_batches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "production_batches_update_authenticated" ON public.production_batches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "production_batches_delete_authenticated" ON public.production_batches FOR DELETE USING (auth.uid() IS NOT NULL);

-- Inventory Transactions: Authenticated users only
CREATE POLICY "inventory_transactions_select_authenticated" ON public.inventory_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "inventory_transactions_insert_authenticated" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Contact Inquiries: Public insert, authenticated read/update
CREATE POLICY "inquiries_select_authenticated" ON public.contact_inquiries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "inquiries_insert_public" ON public.contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "inquiries_update_authenticated" ON public.contact_inquiries FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGER FOR PROFILE CREATION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON public.raw_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contact_inquiries_updated_at BEFORE UPDATE ON public.contact_inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
