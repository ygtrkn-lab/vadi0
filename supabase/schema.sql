-- Vadiler E-commerce Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  price INTEGER NOT NULL,
  old_price INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  image TEXT NOT NULL,
  hover_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  category_name TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  delivery_info TEXT DEFAULT '',
  care_tips TEXT DEFAULT '',
  occasion_tags TEXT[] DEFAULT '{}',
  color_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  cover_type TEXT DEFAULT 'image',
  cover_image TEXT DEFAULT '',
  cover_video TEXT DEFAULT '',
  cover_mobile_image TEXT DEFAULT '',
  cover_overlay TEXT DEFAULT 'dark',
  cover_cta_text TEXT DEFAULT 'Keşfet',
  cover_subtitle TEXT DEFAULT '',
  product_count INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery Off Days Table
CREATE TABLE IF NOT EXISTS delivery_off_days (
  id SERIAL PRIMARY KEY,
  off_date DATE NOT NULL UNIQUE,
  note TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT ('cust_' || substring(uuid_generate_v4()::text, 1, 8)),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  addresses JSONB DEFAULT '[]',
  orders TEXT[] DEFAULT '{}',
  favorites TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ord_' || substring(uuid_generate_v4()::text, 1, 8)),
  order_number SERIAL UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  products JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  delivery JSONB NOT NULL,
  payment JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  tracking_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT ('review_' || substring(uuid_generate_v4()::text, 1, 8)),
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  pros JSONB DEFAULT '[]',
  cons JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  seller_response JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, customer_id)
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT ('coupon_' || substring(uuid_generate_v4()::text, 1, 8)),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  min_order_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,
  usage_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_delivery_off_days_date ON delivery_off_days(off_date);

-- Row Level Security (RLS) Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_off_days ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Customers can view their own data" ON customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON customers;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON coupons;
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Customers can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Verified customers can create reviews" ON reviews;
DROP POLICY IF EXISTS "Service role can do anything with products" ON products;
DROP POLICY IF EXISTS "Service role can do anything with categories" ON categories;
DROP POLICY IF EXISTS "Service role can do anything with customers" ON customers;
DROP POLICY IF EXISTS "Service role can do anything with orders" ON orders;
DROP POLICY IF EXISTS "Service role can do anything with reviews" ON reviews;
DROP POLICY IF EXISTS "Service role can do anything with coupons" ON coupons;
DROP POLICY IF EXISTS "Delivery off days are viewable by everyone" ON delivery_off_days;
DROP POLICY IF EXISTS "Service role can do anything with delivery off days" ON delivery_off_days;

-- Public read access for products and categories
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Customers can only view their own data
CREATE POLICY "Customers can view their own data" ON customers
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Customers can update their own data" ON customers
  FOR UPDATE USING (auth.uid()::text = id);

-- Orders policies
CREATE POLICY "Customers can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_id);

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Coupons are viewable by everyone
CREATE POLICY "Coupons are viewable by everyone" ON coupons
  FOR SELECT USING (true);

CREATE POLICY "Delivery off days are viewable by everyone" ON delivery_off_days
  FOR SELECT USING (true);

-- Reviews policies
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Customers can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid()::text = customer_id);

CREATE POLICY "Verified customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid()::text = customer_id AND
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_id = customer_id
      AND o.id = order_id
      AND o.products::jsonb @> json_build_array(json_build_object('productId', product_id))::jsonb
    )
  );

-- Admin policies (you can set service_role for admin operations)
CREATE POLICY "Service role can do anything with products" ON products
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with categories" ON categories
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with customers" ON customers
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with orders" ON orders
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with reviews" ON reviews
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with coupons" ON coupons
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can do anything with delivery off days" ON delivery_off_days
  USING (auth.jwt()->>'role' = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS update_product_rating_on_review_change ON reviews;
DROP TRIGGER IF EXISTS update_delivery_off_days_updated_at ON delivery_off_days;

-- Apply updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_off_days_updated_at BEFORE UPDATE ON delivery_off_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product rating and review count
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    ), 0)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update product rating on review changes
CREATE TRIGGER update_product_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();
