-- Create storage bucket for knowledge base files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  false, -- Not public, requires authentication
  10485760, -- 10MB limit
  ARRAY[
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'application/json'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for knowledge-base bucket

-- Policy: Agencies can upload files for their clients
CREATE POLICY "Agencies can upload knowledge base files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  auth.jwt() ->> 'email' IN (
    SELECT contact_email FROM public.agencies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Agencies can view their own files
CREATE POLICY "Agencies can view their knowledge base files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-base' AND
  auth.jwt() ->> 'email' IN (
    SELECT contact_email FROM public.agencies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Agencies can update their own files
CREATE POLICY "Agencies can update their knowledge base files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'knowledge-base' AND
  auth.jwt() ->> 'email' IN (
    SELECT contact_email FROM public.agencies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Agencies can delete their own files
CREATE POLICY "Agencies can delete their knowledge base files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-base' AND
  auth.jwt() ->> 'email' IN (
    SELECT contact_email FROM public.agencies
    WHERE id::text = (storage.foldername(name))[1]
  )
);
