// Voice Agent System Types
// Matches database schema from migration 20251118000000_add_voice_agents.sql

export interface TwilioCredentials {
  id: string;
  agency_id: string;
  encrypted_account_sid: string;
  encrypted_auth_token: string;
  iv: string;
  auth_tag: string;
  is_verified: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElevenLabsCredentials {
  id: string;
  agency_id: string;
  encrypted_api_key: string;
  iv: string;
  auth_tag: string;
  is_verified: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EmbeddingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface KnowledgeBaseFile {
  id: string;
  client_id: string;
  agency_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  embedding_status: EmbeddingStatus;
  embedding_error: string | null;
  chunk_count: number;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseEmbedding {
  id: string;
  file_id: string;
  client_id: string;
  agency_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding: number[]; // Vector represented as number array
  metadata: Record<string, any>;
  created_at: string;
}

export type PhoneNumberStatus = 'active' | 'inactive' | 'released';

export interface VoiceAgentPhoneNumber {
  id: string;
  agency_id: string;
  client_id: string | null;
  phone_number: string; // E.164 format
  twilio_sid: string;
  friendly_name: string | null;
  status: PhoneNumberStatus;
  monthly_cost_cents: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export type VoiceAgentStatus = 'active' | 'paused' | 'deleted';

export interface VoiceAgentSettings {
  max_tokens?: number;
  temperature?: number;
  context_window_size?: number;
  enable_sentiment_analysis?: boolean;
  enable_appointment_detection?: boolean;
  custom_vocabulary?: string[];
  webhook_url?: string;
  [key: string]: any;
}

export interface VoiceAgent {
  id: string;
  client_id: string;
  agency_id: string;
  phone_number_id: string | null;
  name: string;
  status: VoiceAgentStatus;
  system_prompt: string;
  first_message: string;
  voice_id: string; // ElevenLabs voice ID
  voice_name: string | null;
  transfer_phone_number: string | null;
  recording_enabled: boolean;
  transcription_enabled: boolean;
  max_duration_seconds: number;
  use_knowledge_base: boolean;
  knowledge_base_context: string | null;
  settings: VoiceAgentSettings;
  total_calls: number;
  total_minutes: number;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  duration_ms?: number;
}

export interface VoiceCall {
  id: string;
  voice_agent_id: string;
  client_id: string;
  agency_id: string;
  twilio_call_sid: string;
  from_number: string;
  to_number: string;
  status: string | null;
  direction: string | null;
  started_at: string | null;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: TranscriptMessage[] | null;
  summary: string | null;
  sentiment: string | null;
  key_topics: string[] | null;
  transferred: boolean;
  transfer_to: string | null;
  appointment_scheduled: boolean;
  recording_url: string | null;
  recording_duration_seconds: number | null;
  twilio_cost_cents: number | null;
  elevenlabs_cost_cents: number | null;
  total_cost_cents: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ElevenLabs Voice Options
export interface ElevenLabsVoiceOption {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
}

// Preset professional voices for ElevenLabs
export const ELEVENLABS_PRESET_VOICES: ElevenLabsVoiceOption[] = [
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Calm, friendly female voice - ideal for customer service',
    labels: {
      accent: 'American',
      age: 'Young',
      gender: 'Female',
      use_case: 'Conversational'
    }
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: 'Confident, professional female voice',
    labels: {
      accent: 'American',
      age: 'Young',
      gender: 'Female',
      use_case: 'Professional'
    }
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Soft, engaging female voice',
    labels: {
      accent: 'American',
      age: 'Young',
      gender: 'Female',
      use_case: 'Conversational'
    }
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: 'Well-rounded, professional male voice',
    labels: {
      accent: 'American',
      age: 'Young',
      gender: 'Male',
      use_case: 'Professional'
    }
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    description: 'Crisp, authoritative male voice',
    labels: {
      accent: 'American',
      age: 'Middle-aged',
      gender: 'Male',
      use_case: 'Professional'
    }
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Deep, resonant male voice',
    labels: {
      accent: 'American',
      age: 'Middle-aged',
      gender: 'Male',
      use_case: 'Narrative'
    }
  },
  {
    voice_id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    description: 'Dynamic, raspy male voice',
    labels: {
      accent: 'American',
      age: 'Young',
      gender: 'Male',
      use_case: 'Conversational'
    }
  }
];

// Twilio Webhook Payloads
export interface TwilioWebhookPayload {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'canceled' | 'failed';
  Direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
  ToCity?: string;
  ToState?: string;
  ToCountry?: string;
  CallerName?: string;
  [key: string]: any;
}

export interface TwilioStatusCallback extends TwilioWebhookPayload {
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  Timestamp?: string;
}

// ElevenLabs Conversational AI Configuration
export interface ElevenLabsConversationConfig {
  agent: {
    prompt: {
      prompt: string; // System prompt
      llm?: string; // LLM model (e.g., "gpt-4")
      temperature?: number;
      max_tokens?: number;
    };
    first_message?: string;
    language?: string;
  };
  tts: {
    voice_id: string;
    model_id?: string; // e.g., "eleven_turbo_v2"
    optimize_streaming_latency?: number;
    stability?: number;
    similarity_boost?: number;
  };
  conversation_config?: {
    max_duration_seconds?: number;
    enable_interruptions?: boolean;
    enable_background_sound?: boolean;
  };
}

// Frontend Form Types
export interface VoiceAgentFormData {
  name: string;
  client_id: string;
  phone_number_id: string | null;
  system_prompt: string;
  first_message: string;
  voice_id: string;
  voice_name: string | null;
  transfer_phone_number: string | null;
  recording_enabled: boolean;
  transcription_enabled: boolean;
  max_duration_seconds: number;
  use_knowledge_base: boolean;
}

export interface TwilioCredentialsFormData {
  account_sid: string;
  auth_token: string;
}

export interface ElevenLabsCredentialsFormData {
  api_key: string;
}

export interface PhoneNumberProvisionRequest {
  area_code?: string; // e.g., "415" for San Francisco
  country_code?: string; // Default "US"
  client_id?: string; // Optional assignment to client
  friendly_name?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CallAnalytics {
  total_calls: number;
  total_minutes: number;
  total_cost_cents: number;
  avg_duration_seconds: number;
  answered_calls: number;
  missed_calls: number;
  transferred_calls: number;
  appointments_scheduled: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_topics: Array<{ topic: string; count: number }>;
  calls_by_hour: Array<{ hour: number; count: number }>;
  calls_by_day: Array<{ date: string; count: number }>;
}

export interface KnowledgeBaseSearchResult {
  chunk_text: string;
  similarity: number;
  file_name: string;
  chunk_index: number;
}

// WebSocket Types for Real-time Updates
export interface VoiceCallRealtimeUpdate {
  call_id: string;
  status: string;
  transcript_update?: TranscriptMessage;
  duration_seconds?: number;
  sentiment?: string;
}
