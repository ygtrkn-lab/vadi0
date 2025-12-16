-- Migration: Add missing columns for customer and order data migration
-- Date: 2025-12-11
-- Description: Adds columns from local JSON files that are missing in Supabase schema

-- ========================================
-- CUSTOMERS TABLE UPDATES
-- ========================================
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS account_credit INTEGER DEFAULT 0;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent DESC);

-- ========================================
-- ORDERS TABLE UPDATES
-- ========================================
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message JSONB,
  ADD COLUMN IF NOT EXISTS order_time_group TEXT,
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_is_guest ON orders(is_guest);
CREATE INDEX IF NOT EXISTS idx_orders_order_time_group ON orders(order_time_group);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Make customer_id nullable for guest orders
ALTER TABLE orders 
  ALTER COLUMN customer_id DROP NOT NULL;

-- ========================================
-- COUPONS TABLE UPDATES
-- ========================================
ALTER TABLE coupons 
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS applicable_categories INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_products INTEGER[] DEFAULT '{}';

-- Add indexes for applicability queries
CREATE INDEX IF NOT EXISTS idx_coupons_applicable_categories ON coupons USING GIN(applicable_categories);
CREATE INDEX IF NOT EXISTS idx_coupons_applicable_products ON coupons USING GIN(applicable_products);

-- ========================================
-- ORDER NUMBER SEQUENCE SYNC
-- ========================================
-- Set sequence to match orderCounter.json (nextOrderNumber: 100007)
-- The 'false' parameter means next call will return 100007
SELECT setval('orders_order_number_seq', 100007, false);

-- ========================================
-- VERIFICATION QUERIES (commented out)
-- ========================================
-- Run these after migration to verify schema:

-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'customers' 
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'coupons' 
-- ORDER BY ordinal_position;

-- SELECT last_value FROM orders_order_number_seq;
