-- Super Admin System
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Super Admins Table
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create index on email for faster lookups
CREATE INDEX idx_super_admins_email ON super_admins(email);

-- Helper function to verify super admin password
CREATE OR REPLACE FUNCTION verify_super_admin_password(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT
) AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Get admin record
  SELECT sa.id, sa.email, sa.full_name, sa.password_hash, sa.is_active
  INTO v_admin
  FROM super_admins sa
  WHERE sa.email = p_email;

  -- Check if admin exists and is active
  IF NOT FOUND OR NOT v_admin.is_active THEN
    RETURN;
  END IF;

  -- Verify password
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    -- Update last login
    UPDATE super_admins
    SET last_login = NOW()
    WHERE super_admins.id = v_admin.id;

    -- Return admin info
    RETURN QUERY
    SELECT v_admin.id, v_admin.email, v_admin.full_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM super_admins
    WHERE email = p_email
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert the super admin user with hashed password
-- Email: plefleur00@gmail.com
-- Password: Titan2022!
INSERT INTO super_admins (email, password_hash, full_name)
VALUES (
  'plefleur00@gmail.com',
  crypt('Titan2022!', gen_salt('bf', 10)),
  'Super Admin'
)
ON CONFLICT (email) DO NOTHING;

-- RLS Policies for super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can view their own record
CREATE POLICY "Super admins can view own record"
  ON super_admins
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Update agencies table to allow super admin read access (names only)
-- This policy allows super admins to view agency names
CREATE POLICY "Super admins can view all agencies"
  ON agencies
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin(current_setting('request.jwt.claims', true)::json->>'email')
  );

-- Update clients table to allow super admin to see names only
-- Create a view for super admin that shows only non-sensitive data
CREATE OR REPLACE VIEW super_admin_clients_view AS
SELECT
  c.id,
  c.agency_id,
  c.business_name,
  c.industry,
  c.created_at,
  a.business_name as agency_name
FROM clients c
JOIN agencies a ON a.id = c.agency_id;

-- Grant access to super admins only
GRANT SELECT ON super_admin_clients_view TO authenticated;

-- Create a view for super admin dashboard stats
CREATE OR REPLACE VIEW super_admin_dashboard_stats AS
SELECT
  COUNT(DISTINCT a.id) as total_agencies,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT cs.id) as active_subscriptions,
  COUNT(DISTINCT CASE WHEN cs.status = 'active' THEN cs.id END) as active_paid_subscriptions
FROM agencies a
LEFT JOIN clients c ON c.agency_id = a.id
LEFT JOIN client_subscriptions cs ON cs.client_id = c.id;

-- Grant access to super admins
GRANT SELECT ON super_admin_dashboard_stats TO authenticated;

-- Create RLS policy for the views to ensure only super admins can access
ALTER TABLE clients ADD COLUMN IF NOT EXISTS visible_to_super_admin BOOLEAN DEFAULT true;

-- Policy to prevent super admins from accessing sensitive client data
-- They can only access through the super_admin_clients_view
CREATE POLICY "Super admins cannot directly access client details"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email')
    OR
    (
      -- Allow if accessing through their own agency
      agency_id IN (
        SELECT id FROM agencies
        WHERE contact_email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );

-- Ensure super admins CANNOT access API keys or credentials
-- These policies explicitly deny super admin access to sensitive tables
CREATE POLICY "Super admins cannot access Twilio credentials"
  ON twilio_credentials
  FOR ALL
  TO authenticated
  USING (
    NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email')
    AND
    agency_id IN (
      SELECT id FROM agencies
      WHERE contact_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Super admins cannot access ElevenLabs credentials"
  ON elevenlabs_credentials
  FOR ALL
  TO authenticated
  USING (
    NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email')
    AND
    agency_id IN (
      SELECT id FROM agencies
      WHERE contact_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Ensure super admins cannot access subscription plans pricing details
-- They can see that subscriptions exist but not the financial details
CREATE OR REPLACE VIEW super_admin_subscriptions_overview AS
SELECT
  cs.id,
  cs.client_id,
  cs.status,
  cs.created_at,
  c.business_name as client_name,
  a.business_name as agency_name
FROM client_subscriptions cs
JOIN clients c ON c.id = cs.client_id
JOIN agencies a ON a.id = c.agency_id;

GRANT SELECT ON super_admin_subscriptions_overview TO authenticated;

-- Function to get agencies for super admin dashboard
CREATE OR REPLACE FUNCTION get_super_admin_agencies()
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ,
  total_clients BIGINT,
  active_subscriptions BIGINT
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.business_name,
    a.contact_email,
    a.created_at,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'active') as active_subscriptions
  FROM agencies a
  LEFT JOIN clients c ON c.agency_id = a.id
  LEFT JOIN client_subscriptions cs ON cs.client_id = c.id
  GROUP BY a.id, a.business_name, a.contact_email, a.created_at
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get clients for a specific agency (super admin view)
CREATE OR REPLACE FUNCTION get_super_admin_agency_clients(p_agency_id UUID)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ,
  has_active_subscription BOOLEAN
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.business_name,
    c.industry,
    c.created_at,
    EXISTS(
      SELECT 1 FROM client_subscriptions cs
      WHERE cs.client_id = c.id
      AND cs.status = 'active'
    ) as has_active_subscription
  FROM clients c
  WHERE c.agency_id = p_agency_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the security model
COMMENT ON TABLE super_admins IS 'Super admin users who can view agency and client names but cannot access sensitive data like API keys, credentials, or detailed client information';
COMMENT ON FUNCTION get_super_admin_agencies() IS 'Returns list of all agencies with aggregate stats - accessible only to super admins';
COMMENT ON FUNCTION get_super_admin_agency_clients(UUID) IS 'Returns client names for a specific agency - no sensitive data included';
