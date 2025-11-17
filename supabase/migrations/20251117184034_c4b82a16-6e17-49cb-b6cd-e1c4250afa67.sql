-- Create agencies table
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  custom_domain TEXT,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_tested TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, service_name)
);

-- Enable Row Level Security
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies
CREATE POLICY "Agencies are viewable by everyone"
  ON public.agencies FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create an agency"
  ON public.agencies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agencies can update their own data"
  ON public.agencies FOR UPDATE
  USING (id IN (
    SELECT agency_id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for clients
CREATE POLICY "Clients can view their own data"
  ON public.clients FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Agencies can view their clients"
  ON public.clients FOR SELECT
  USING (agency_id IN (
    SELECT agency_id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Agencies can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clients can update their own data"
  ON public.clients FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for api_keys
CREATE POLICY "Clients can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can insert their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Create indexes for better performance
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_api_keys_client_id ON public.api_keys(client_id);
CREATE INDEX idx_agencies_subdomain ON public.agencies(subdomain);