-- Create wordpress_sites table
CREATE TABLE public.wordpress_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  app_password TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  site_info JSONB,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wordpress_sites
CREATE POLICY "Clients can view their own WordPress sites"
  ON public.wordpress_sites FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can insert their own WordPress sites"
  ON public.wordpress_sites FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can update their own WordPress sites"
  ON public.wordpress_sites FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can delete their own WordPress sites"
  ON public.wordpress_sites FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Create index for better performance
CREATE INDEX idx_wordpress_sites_client_id ON public.wordpress_sites(client_id);