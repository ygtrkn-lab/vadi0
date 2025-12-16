-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_public ON site_settings(is_public);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public settings are viewable by everyone
CREATE POLICY "Public settings are viewable by everyone" 
  ON site_settings FOR SELECT 
  USING (is_public = true);

-- RLS Policies: Service role can manage all settings
CREATE POLICY "Service role can manage all settings" 
  ON site_settings FOR ALL 
  USING (auth.role() = 'service_role');

-- Create delivery_zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  districts JSONB NOT NULL,
  base_fee INTEGER NOT NULL,
  free_shipping_threshold INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for delivery zones
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);

-- Enable Row Level Security for delivery zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view active delivery zones
CREATE POLICY "Active delivery zones are viewable by everyone" 
  ON delivery_zones FOR SELECT 
  USING (is_active = true);

-- RLS Policies: Service role can manage delivery zones
CREATE POLICY "Service role can manage delivery zones" 
  ON delivery_zones FOR ALL 
  USING (auth.role() = 'service_role');

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  delivery_available BOOLEAN DEFAULT false,
  fee_multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for holidays
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Enable Row Level Security for holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view holidays
CREATE POLICY "Holidays are viewable by everyone" 
  ON holidays FOR SELECT 
  TO public
  USING (true);

-- RLS Policies: Service role can manage holidays
CREATE POLICY "Service role can manage holidays" 
  ON holidays FOR ALL 
  USING (auth.role() = 'service_role');

-- Insert default settings from settings.json
INSERT INTO site_settings (category, key, value, is_public) VALUES
-- Site settings
('site', 'name', '"Vadiler Çiçekçilik"', true),
('site', 'description', '"İstanbul''un en taze çiçekleri kapınızda"', true),
('site', 'logo', '"https://res.cloudinary.com/dgdl1vdao/image/upload/v1765226544/vadiler/branding/logo.png"', true),
('site', 'favicon', '"/favicon.ico"', true),
('site', 'phone', '"0850 307 4876"', true),
('site', 'address', '"İstanbul, Türkiye"', true),

-- Delivery settings
('delivery', 'freeDeliveryThreshold', '500', true),
('delivery', 'standardDeliveryFee', '49', true),
('delivery', 'expressDeliveryFee', '99', true),
('delivery', 'sameDay', 'true', true),
('delivery', 'sameDayCutoffTime', '"14:00"', true),
('delivery', 'deliveryAreas', '["İstanbul Anadolu", "İstanbul Avrupa"]', true),
('delivery', 'workingHours', '{"start": "08:00", "end": "21:00"}', true),

-- Payment settings
('payment', 'methods', '[
  {"id": "credit_card", "name": "Kredi Kartı", "isActive": true},
  {"id": "bank_transfer", "name": "Havale/EFT", "isActive": true},
  {"id": "cash_on_delivery", "name": "Kapıda Ödeme", "isActive": true, "fee": 10}
]', true),
('payment', 'installments', '[1, 2, 3, 6, 9, 12]', true),

-- Promotions settings
('promotions', 'welcomeDiscount', '10', true),
('promotions', 'firstOrderDiscount', '15', true),
('promotions', 'referralBonus', '50', true),

-- Social media settings
('social', 'instagram', '"https://instagram.com/vadilercom"', true),
('social', 'facebook', '"https://facebook.com/vadilercom"', true),
('social', 'twitter', '"https://twitter.com/vadilercom"', true),
('social', 'whatsapp', '"908503074876"', true),

-- SEO settings
('seo', 'defaultTitle', '"Vadiler Çiçekçilik - Online Çiçek Siparişi"', true),
('seo', 'defaultDescription', '"İstanbul''da hızlı teslimat ile taze çiçek siparişi. Güller, orkideler, buketler ve daha fazlası."', true),
('seo', 'keywords', '["çiçek siparişi", "online çiçekçi", "istanbul çiçek", "buket", "gül buketi"]', true)
ON CONFLICT (category, key) DO NOTHING;

-- Insert default holidays (2025)
INSERT INTO holidays (date, name, delivery_available, fee_multiplier, is_recurring) VALUES
('2025-01-01', 'Yılbaşı', false, 1.0, true),
('2025-03-30', 'Ramazan Bayramı 1. Gün', false, 1.0, false),
('2025-03-31', 'Ramazan Bayramı 2. Gün', true, 1.5, false),
('2025-04-01', 'Ramazan Bayramı 3. Gün', true, 1.5, false),
('2025-04-23', '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı', true, 1.0, true),
('2025-05-01', '1 Mayıs İşçi Bayramı', true, 1.2, true),
('2025-05-19', '19 Mayıs Atatürk''ü Anma Gençlik ve Spor Bayramı', true, 1.0, true),
('2025-06-06', 'Kurban Bayramı 1. Gün', false, 1.0, false),
('2025-06-07', 'Kurban Bayramı 2. Gün', true, 1.5, false),
('2025-06-08', 'Kurban Bayramı 3. Gün', true, 1.5, false),
('2025-06-09', 'Kurban Bayramı 4. Gün', true, 1.5, false),
('2025-07-15', '15 Temmuz Demokrasi ve Milli Birlik Günü', true, 1.0, true),
('2025-08-30', '30 Ağustos Zafer Bayramı', true, 1.0, true),
('2025-10-29', '29 Ekim Cumhuriyet Bayramı', true, 1.0, true),
('2025-02-14', 'Sevgililer Günü', true, 1.5, true),
('2025-05-11', 'Anneler Günü', true, 2.0, true),
('2025-03-08', 'Kadınlar Günü', true, 1.3, true)
ON CONFLICT (date) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for delivery_zones
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
