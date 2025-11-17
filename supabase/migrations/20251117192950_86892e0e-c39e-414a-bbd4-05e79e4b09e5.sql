-- Create jobs table for tracking background tasks
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  job_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  CONSTRAINT valid_job_type CHECK (job_type IN ('publish_article', 'publish_gmb', 'send_email', 'generate_content'))
);

-- Create automation_rules table for recurring content generation
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT,
  frequency_config JSONB,
  content_config JSONB,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('recurring_content', 'auto_publish', 'bulk_generation'))
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Clients can view their own jobs
CREATE POLICY "Clients can view their own jobs"
ON public.jobs
FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can insert their own jobs
CREATE POLICY "Clients can insert their own jobs"
ON public.jobs
FOR INSERT
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can update their own jobs
CREATE POLICY "Clients can update their own jobs"
ON public.jobs
FOR UPDATE
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can delete their own jobs
CREATE POLICY "Clients can delete their own jobs"
ON public.jobs
FOR DELETE
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Enable RLS on automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Clients can view their own automation rules
CREATE POLICY "Clients can view their own automation rules"
ON public.automation_rules
FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can insert their own automation rules
CREATE POLICY "Clients can insert their own automation rules"
ON public.automation_rules
FOR INSERT
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can update their own automation rules
CREATE POLICY "Clients can update their own automation rules"
ON public.automation_rules
FOR UPDATE
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Clients can delete their own automation rules
CREATE POLICY "Clients can delete their own automation rules"
ON public.automation_rules
FOR DELETE
USING (client_id IN (
  SELECT id FROM clients WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Create indexes for performance
CREATE INDEX idx_jobs_scheduled_for ON public.jobs(scheduled_for);
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_content_item_id ON public.jobs(content_item_id);
CREATE INDEX idx_automation_rules_client_id ON public.automation_rules(client_id);
CREATE INDEX idx_automation_rules_next_run ON public.automation_rules(next_run) WHERE is_active = true;