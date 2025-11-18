import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const client_id = formData.get('client_id') as string;

    if (!file || !client_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, client_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type (text, pdf, docx)
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'Unsupported file type. Allowed types: .txt, .pdf, .docx, .md, .json'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency for this user
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('id')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: 'Agency not found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify client belongs to agency
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, business_name')
      .eq('id', client_id)
      .eq('agency_id', agency.id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found or does not belong to your agency' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create storage path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const storagePath = `${agency.id}/${client_id}/knowledge-base/${timestamp}-${file.name}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('knowledge-base')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text from file
    let extractedText = '';

    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
      // For text files, read directly
      extractedText = await file.text();
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'll mark for processing (would use pdf-parse or similar in production)
      extractedText = null; // Will be processed by background job
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX, we'll mark for processing (would use mammoth or similar in production)
      extractedText = null; // Will be processed by background job
    }

    // Create database record
    const { data: knowledgeFile, error: dbError } = await supabaseClient
      .from('knowledge_base_files')
      .insert({
        client_id,
        agency_id: agency.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        extracted_text: extractedText,
        embedding_status: extractedText ? 'pending' : 'processing',
        chunk_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving file metadata to database:', dbError);

      // Clean up uploaded file
      await supabaseClient.storage
        .from('knowledge-base')
        .remove([storagePath]);

      return new Response(
        JSON.stringify({ error: 'Failed to save file metadata', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have extracted text, trigger embedding processing
    if (extractedText) {
      // Call process-knowledge-embeddings function asynchronously
      supabaseClient.functions.invoke('process-knowledge-embeddings', {
        body: { file_id: knowledgeFile.id }
      }).catch(err => {
        console.error('Failed to trigger embedding processing:', err);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: knowledgeFile.id,
          file_name: knowledgeFile.file_name,
          file_size: knowledgeFile.file_size,
          embedding_status: knowledgeFile.embedding_status,
          created_at: knowledgeFile.created_at,
        },
        next_step: extractedText
          ? 'Processing embeddings in background'
          : 'Text extraction in progress'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-knowledge-file:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
