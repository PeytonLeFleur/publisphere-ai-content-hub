-- Voice Agent System Migration
-- Enables ElevenLabs Conversational AI + Twilio voice agents for clients

-- Enable vector extension for knowledge base embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================
-- CREDENTIALS STORAGE (Encrypted)
-- ==============================================

-- Store encrypted Twilio credentials per agency
CREATE TABLE IF NOT EXISTS public.twilio_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Encrypted credentials (using existing AES-256-GCM encryption)
  encrypted_account_sid TEXT NOT NULL,
  encrypted_auth_token TEXT NOT NULL,
  iv TEXT NOT NULL, -- Initialization vector
  auth_tag TEXT NOT NULL, -- Authentication tag

  -- Status
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(agency_id)
);

-- Store encrypted ElevenLabs credentials per agency
CREATE TABLE IF NOT EXISTS public.elevenlabs_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Encrypted API key
  encrypted_api_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,

  -- Status
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(agency_id)
);

-- ==============================================
-- KNOWLEDGE BASE SYSTEM
-- ==============================================

-- Store knowledge base files per client
CREATE TABLE IF NOT EXISTS public.knowledge_base_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- File details
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, txt, etc.
  file_size INTEGER NOT NULL, -- bytes
  storage_path TEXT NOT NULL, -- Supabase Storage path

  -- Processing
  extracted_text TEXT, -- Raw text extraction
  embedding_status TEXT NOT NULL DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  embedding_error TEXT, -- Error message if failed
  chunk_count INTEGER DEFAULT 0,

  -- Summary for voice agent context
  summary TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store vector embeddings for knowledge base chunks
CREATE TABLE IF NOT EXISTS public.knowledge_base_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.knowledge_base_files(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Chunk details
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,

  -- Vector embedding (OpenAI ada-002 = 1536 dimensions)
  embedding vector(1536),

  -- Metadata for context
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- PHONE NUMBERS & VOICE AGENTS
-- ==============================================

-- Store Twilio phone numbers provisioned for clients
CREATE TABLE IF NOT EXISTS public.voice_agent_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Can be unassigned

  -- Phone number details
  phone_number TEXT NOT NULL UNIQUE, -- E.164 format: +15551234567
  twilio_sid TEXT NOT NULL UNIQUE, -- Twilio resource SID
  friendly_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'released')),

  -- Cost tracking
  monthly_cost_cents INTEGER DEFAULT 115, -- $1.15/month (Twilio standard)
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store voice agents created for clients
CREATE TABLE IF NOT EXISTS public.voice_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES public.voice_agent_phone_numbers(id) ON DELETE SET NULL,

  -- Agent identity
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),

  -- Agent configuration
  system_prompt TEXT NOT NULL,
  first_message TEXT DEFAULT 'Hello! How can I help you today?',

  -- Voice configuration
  voice_id TEXT NOT NULL, -- ElevenLabs voice ID (e.g., '21m00Tcm4TlvDq8ikWAM')
  voice_name TEXT, -- Friendly name like "Rachel"

  -- Behavior settings
  transfer_phone_number TEXT, -- E.164 format for call transfers
  recording_enabled BOOLEAN DEFAULT true,
  transcription_enabled BOOLEAN DEFAULT true,
  max_duration_seconds INTEGER DEFAULT 600, -- 10 minutes default

  -- Knowledge Base Integration
  use_knowledge_base BOOLEAN DEFAULT true,
  knowledge_base_context TEXT, -- Pre-loaded context summary from KB files

  -- Advanced settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example settings: {"language": "en", "responseDelayMs": 300, "interruptionSensitivity": "medium"}

  -- Analytics
  total_calls INTEGER DEFAULT 0,
  total_minutes DECIMAL(10,2) DEFAULT 0,
  last_call_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- CALL LOGGING & ANALYTICS
-- ==============================================

-- Store call logs from Twilio/ElevenLabs
CREATE TABLE IF NOT EXISTS public.voice_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voice_agent_id UUID NOT NULL REFERENCES public.voice_agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Twilio call details
  twilio_call_sid TEXT NOT NULL UNIQUE,
  from_number TEXT NOT NULL, -- Caller's phone number
  to_number TEXT NOT NULL, -- Your Twilio number

  -- Call status
  status TEXT, -- queued, ringing, in-progress, completed, failed, busy, no-answer, canceled
  direction TEXT, -- inbound, outbound

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Conversation data
  transcript JSONB, -- Array of {role: 'user'|'assistant', message: string, timestamp: string}
  summary TEXT, -- AI-generated call summary
  sentiment TEXT, -- positive, neutral, negative
  key_topics TEXT[], -- Extracted topics/keywords

  -- Actions taken
  transferred BOOLEAN DEFAULT false,
  transfer_to TEXT, -- Phone number transferred to
  appointment_scheduled BOOLEAN DEFAULT false,

  -- Media
  recording_url TEXT,
  recording_duration_seconds INTEGER,

  -- Cost tracking (in cents)
  twilio_cost_cents INTEGER,
  elevenlabs_cost_cents INTEGER,
  total_cost_cents INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_twilio_credentials_agency ON public.twilio_credentials(agency_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_credentials_agency ON public.elevenlabs_credentials(agency_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_client ON public.knowledge_base_files(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_agency ON public.knowledge_base_files(agency_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_status ON public.knowledge_base_files(embedding_status);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_file ON public.knowledge_base_embeddings(file_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_client ON public.knowledge_base_embeddings(client_id);

-- Vector similarity search index (IVFFlat for cosine similarity)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON public.knowledge_base_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_agency ON public.voice_agent_phone_numbers(agency_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_client ON public.voice_agent_phone_numbers(client_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON public.voice_agent_phone_numbers(status);

CREATE INDEX IF NOT EXISTS idx_voice_agents_client ON public.voice_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_agency ON public.voice_agents(agency_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_status ON public.voice_agents(status);
CREATE INDEX IF NOT EXISTS idx_voice_agents_phone ON public.voice_agents(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_voice_calls_agent ON public.voice_calls(voice_agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_client ON public.voice_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_agency ON public.voice_calls(agency_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_started ON public.voice_calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON public.voice_calls(status);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Twilio Credentials: Agency only
ALTER TABLE public.twilio_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own Twilio credentials"
ON public.twilio_credentials
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can insert their own Twilio credentials"
ON public.twilio_credentials
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can update their own Twilio credentials"
ON public.twilio_credentials
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can delete their own Twilio credentials"
ON public.twilio_credentials
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- ElevenLabs Credentials: Agency only
ALTER TABLE public.elevenlabs_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own ElevenLabs credentials"
ON public.elevenlabs_credentials
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can insert their own ElevenLabs credentials"
ON public.elevenlabs_credentials
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can update their own ElevenLabs credentials"
ON public.elevenlabs_credentials
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can delete their own ElevenLabs credentials"
ON public.elevenlabs_credentials
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Knowledge Base Files: Agencies manage, clients view
ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can manage their clients' knowledge base files"
ON public.knowledge_base_files
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own knowledge base files"
ON public.knowledge_base_files
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Knowledge Base Embeddings: Agencies manage, clients view
ALTER TABLE public.knowledge_base_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can manage their clients' knowledge base embeddings"
ON public.knowledge_base_embeddings
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own knowledge base embeddings"
ON public.knowledge_base_embeddings
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Phone Numbers: Agencies manage
ALTER TABLE public.voice_agent_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can manage their phone numbers"
ON public.voice_agent_phone_numbers
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Voice Agents: Agencies manage, clients view
ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can manage their clients' voice agents"
ON public.voice_agents
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own voice agents"
ON public.voice_agents
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Voice Calls: Agencies manage, clients view
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their clients' call logs"
ON public.voice_calls
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can insert call logs"
ON public.voice_calls
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can update their clients' call logs"
ON public.voice_calls
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own call logs"
ON public.voice_calls
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to get knowledge base context for a client (used in voice agent prompts)
CREATE OR REPLACE FUNCTION get_client_knowledge_base_context(
  p_client_id UUID,
  p_max_chunks INTEGER DEFAULT 10
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context TEXT;
BEGIN
  -- Aggregate top chunks from completed knowledge base files
  SELECT string_agg(chunk_text, E'\n\n' ORDER BY created_at DESC)
  INTO v_context
  FROM (
    SELECT chunk_text
    FROM public.knowledge_base_embeddings
    WHERE client_id = p_client_id
    ORDER BY created_at DESC
    LIMIT p_max_chunks
  ) chunks;

  RETURN COALESCE(v_context, 'No knowledge base information available.');
END;
$$;

-- Function to perform vector similarity search on knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
  p_client_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.chunk_text,
    1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM public.knowledge_base_embeddings e
  WHERE e.client_id = p_client_id
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- Function to update voice agent statistics
CREATE OR REPLACE FUNCTION update_voice_agent_stats(
  p_agent_id UUID,
  p_call_duration_seconds INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.voice_agents
  SET
    total_calls = total_calls + 1,
    total_minutes = total_minutes + (p_call_duration_seconds / 60.0),
    last_call_at = now(),
    updated_at = now()
  WHERE id = p_agent_id;
END;
$$;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE public.twilio_credentials IS 'Stores encrypted Twilio Account SID and Auth Token per agency (BYOK model)';
COMMENT ON TABLE public.elevenlabs_credentials IS 'Stores encrypted ElevenLabs API key per agency (BYOK model)';
COMMENT ON TABLE public.knowledge_base_files IS 'Uploaded business documents (PDF, DOCX, TXT) for voice agent context';
COMMENT ON TABLE public.knowledge_base_embeddings IS 'Vector embeddings of knowledge base chunks for semantic search';
COMMENT ON TABLE public.voice_agent_phone_numbers IS 'Twilio phone numbers provisioned for voice agents';
COMMENT ON TABLE public.voice_agents IS 'AI voice agents configured with ElevenLabs + knowledge base integration';
COMMENT ON TABLE public.voice_calls IS 'Complete call logs including transcripts, recordings, and analytics';

COMMENT ON FUNCTION get_client_knowledge_base_context IS 'Retrieves aggregated knowledge base context for voice agent system prompts';
COMMENT ON FUNCTION search_knowledge_base IS 'Performs vector similarity search on client knowledge base using cosine distance';
COMMENT ON FUNCTION update_voice_agent_stats IS 'Updates voice agent call statistics after each completed call';
