-- Super Admin System
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Super Admins Table
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert super admin with pre-hashed password
-- Email: plefleur00@gmail.com
-- Password: Titan2022!
INSERT INTO super_admins (email, password_hash, full_name)
VALUES (
  'plefleur00@gmail.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Titan Admin'
) ON CONFLICT (email) DO NOTHING;

-- Helper functions
CREATE OR REPLACE FUNCTION verify_super_admin_password(input_email TEXT, input_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM super_admins WHERE email = input_email AND is_active = true;
  IF stored_hash IS NULL THEN RETURN false; END IF;
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM super_admins WHERE email = user_email AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Simple views with only IDs (no column name assumptions)
CREATE OR REPLACE VIEW super_admin_clients_view AS
SELECT c.id, c.agency_id, c.created_at
FROM clients c;

CREATE OR REPLACE VIEW super_admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM agencies) as total_agencies,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM agency_subscriptions WHERE status = 'active') as active_subscriptions;

GRANT SELECT ON super_admin_clients_view TO authenticated;
GRANT SELECT ON super_admin_dashboard_stats TO authenticated;
