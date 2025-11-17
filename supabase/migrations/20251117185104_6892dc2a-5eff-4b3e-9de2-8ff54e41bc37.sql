-- Create content_items table
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('blog_article', 'gmb_post', 'service_page')),
  title TEXT,
  content TEXT NOT NULL,
  meta_description TEXT,
  focus_keyword TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  wordpress_site_id UUID REFERENCES public.wordpress_sites(id) ON DELETE SET NULL,
  wordpress_post_id INTEGER,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  generation_params JSONB,
  estimated_api_cost DECIMAL(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generation_templates table
CREATE TABLE public.generation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('blog_article', 'gmb_post', 'service_page')),
  default_tone TEXT,
  target_audience TEXT,
  custom_instructions TEXT,
  sample_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_items
CREATE POLICY "Clients can view their own content"
  ON public.content_items FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can insert their own content"
  ON public.content_items FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can update their own content"
  ON public.content_items FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can delete their own content"
  ON public.content_items FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for generation_templates
CREATE POLICY "Clients can view their own templates"
  ON public.generation_templates FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can insert their own templates"
  ON public.generation_templates FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can update their own templates"
  ON public.generation_templates FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

CREATE POLICY "Clients can delete their own templates"
  ON public.generation_templates FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Create indexes for better performance
CREATE INDEX idx_content_items_client_id ON public.content_items(client_id);
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_items_scheduled ON public.content_items(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_generation_templates_client_id ON public.generation_templates(client_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_content_updated_at();