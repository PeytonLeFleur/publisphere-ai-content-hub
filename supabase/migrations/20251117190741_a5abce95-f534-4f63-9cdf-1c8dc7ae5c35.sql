-- Add GMB-specific fields to content_items
ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS performance_views integer,
ADD COLUMN IF NOT EXISTS performance_clicks integer,
ADD COLUMN IF NOT EXISTS cta_type text,
ADD COLUMN IF NOT EXISTS emoji_count integer,
ADD COLUMN IF NOT EXISTS character_count integer,
ADD COLUMN IF NOT EXISTS suggested_image_query text;