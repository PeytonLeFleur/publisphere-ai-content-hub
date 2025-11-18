import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple text chunker - splits text into ~500 token chunks with overlap
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for background processing
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get request body
    const { file_id } = await req.json();

    if (!file_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: file_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get file metadata
    const { data: file, error: fileError } = await supabaseClient
      .from('knowledge_base_files')
      .select('*')
      .eq('id', file_id)
      .single();

    if (fileError || !file) {
      return new Response(
        JSON.stringify({ error: 'Knowledge base file not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    if (file.embedding_status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'File already processed',
          chunk_count: file.chunk_count
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabaseClient
      .from('knowledge_base_files')
      .update({ embedding_status: 'processing' })
      .eq('id', file_id);

    // Get extracted text
    if (!file.extracted_text) {
      await supabaseClient
        .from('knowledge_base_files')
        .update({
          embedding_status: 'failed',
          embedding_error: 'No extracted text available'
        })
        .eq('id', file_id);

      return new Response(
        JSON.stringify({ error: 'No extracted text available for this file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      await supabaseClient
        .from('knowledge_base_files')
        .update({
          embedding_status: 'failed',
          embedding_error: 'OpenAI API key not configured'
        })
        .eq('id', file_id);

      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chunk the text
    const chunks = chunkText(file.extracted_text);

    if (chunks.length === 0) {
      await supabaseClient
        .from('knowledge_base_files')
        .update({
          embedding_status: 'failed',
          embedding_error: 'No valid text chunks generated'
        })
        .eq('id', file_id);

      return new Response(
        JSON.stringify({ error: 'No valid text chunks could be generated from file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embeddings for each chunk
    const embeddings: any[] = [];
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i], openaiApiKey);

        embeddings.push({
          file_id: file.id,
          client_id: file.client_id,
          agency_id: file.agency_id,
          chunk_text: chunks[i],
          chunk_index: i,
          embedding: JSON.stringify(embedding), // Store as JSON string for pgvector
          metadata: {
            file_name: file.file_name,
            file_type: file.file_type,
            chunk_length: chunks[i].length,
          }
        });

        processedCount++;

        // Batch insert every 10 chunks to avoid memory issues
        if (embeddings.length >= 10) {
          await supabaseClient
            .from('knowledge_base_embeddings')
            .insert(embeddings);
          embeddings.length = 0; // Clear array
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        // Continue processing other chunks
      }
    }

    // Insert remaining embeddings
    if (embeddings.length > 0) {
      await supabaseClient
        .from('knowledge_base_embeddings')
        .insert(embeddings);
    }

    // Generate summary of the file content (first 200 words)
    const summaryWords = file.extracted_text.split(/\s+/).slice(0, 200).join(' ');
    const summary = summaryWords + (file.extracted_text.split(/\s+/).length > 200 ? '...' : '');

    // Update file status to completed
    await supabaseClient
      .from('knowledge_base_files')
      .update({
        embedding_status: 'completed',
        chunk_count: processedCount,
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', file_id);

    // Update all voice agents using this client's knowledge base
    await supabaseClient.rpc('refresh_voice_agent_knowledge_base', {
      p_client_id: file.client_id
    }).catch(err => {
      console.log('Note: Voice agents will update knowledge base on next use');
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Knowledge base embeddings processed successfully',
        file_id: file.id,
        chunk_count: processedCount,
        summary: summary.substring(0, 100) + '...',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-knowledge-embeddings:', error);

    // Try to update file status to failed
    const { file_id } = await req.json().catch(() => ({ file_id: null }));
    if (file_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      await supabaseClient
        .from('knowledge_base_files')
        .update({
          embedding_status: 'failed',
          embedding_error: error.message || 'Unknown error'
        })
        .eq('id', file_id)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
