-- Add 'password-reset' to customer_email_otps purpose constraint
-- Migration: 2025-12-17_add_password_reset_purpose

-- Drop existing constraint
ALTER TABLE customer_email_otps 
DROP CONSTRAINT IF EXISTS customer_email_otps_purpose_check;

-- Add new constraint with password-reset purpose
ALTER TABLE customer_email_otps 
ADD CONSTRAINT customer_email_otps_purpose_check 
CHECK (purpose IN ('login', 'register', 'password-reset'));

-- Add comment
COMMENT ON TABLE customer_email_otps IS 'Stores OTP codes for customer authentication: login, register, and password-reset';
