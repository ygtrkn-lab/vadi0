-- Customer email OTPs (post-password verification)

CREATE TABLE IF NOT EXISTS customer_email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register')),
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customer_email_otps_email_purpose_created
  ON customer_email_otps(email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_email_otps_expires_at
  ON customer_email_otps(expires_at);

ALTER TABLE customer_email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do anything with customer_email_otps" ON customer_email_otps;
CREATE POLICY "Service role can do anything with customer_email_otps"
  ON customer_email_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
