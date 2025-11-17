import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content_type, params } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get client_id
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    // Get client's Anthropic API key
    const { data: apiKey, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('encrypted_key, is_valid')
      .eq('client_id', client.id)
      .eq('service_name', 'anthropic')
      .single();

    if (keyError || !apiKey || !apiKey.is_valid) {
      throw new Error('Please configure your Anthropic API key in Settings → API Keys');
    }

    const anthropicKey = apiKey.encrypted_key; // TODO: Decrypt in production

    if (action === 'generate_outline') {
      const outline = await generateBlogOutline(anthropicKey, params);
      return new Response(
        JSON.stringify({ success: true, outline }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_full') {
      if (content_type === 'blog_article') {
        const content = await generateFullArticle(anthropicKey, params);
        
        // Save to database
        const { data: savedContent, error: saveError } = await supabaseClient
          .from('content_items')
          .insert({
            client_id: client.id,
            type: 'blog_article',
            title: content.titles[0],
            content: content.html,
            meta_description: content.meta_description,
            focus_keyword: content.focus_keyword,
            status: 'draft',
            generation_params: params,
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving content:', saveError);
        }

        return new Response(
          JSON.stringify({ success: true, content, content_id: savedContent?.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (content_type === 'gmb_post') {
        const content = await generateGmbPost(anthropicKey, params);
        
        // Save to database
        const { data: savedContent, error: saveError } = await supabaseClient
          .from('content_items')
          .insert({
            client_id: client.id,
            type: 'gmb_post',
            content: content.text,
            status: 'draft',
            generation_params: params,
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving content:', saveError);
        }

        return new Response(
          JSON.stringify({ success: true, content, content_id: savedContent?.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Generate content error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateBlogOutline(apiKey: string, params: any): Promise<string> {
  const prompt = `You are an expert SEO content writer. Generate a detailed outline for a blog article with the following parameters:

Topic: ${params.topic}
Target Word Count: ${params.wordCount} words
Tone: ${params.tone}
Target Audience: ${params.targetAudience}
Include FAQ: ${params.includeFaq}

Create a comprehensive outline with:
- An engaging H1 title
- Introduction section
- 5-7 main H2 sections with 2-3 H3 subsections each
- ${params.includeFaq ? 'An FAQ section with 5-7 questions' : ''}
- Conclusion section

Format the outline clearly with proper heading hierarchy (H1, H2, H3).`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate outline with Anthropic API');
  }

  const data = await response.json();
  return data.content[0].text;
}

async function generateFullArticle(apiKey: string, params: any): Promise<any> {
  const prompt = `You are an expert SEO content writer. Write a complete, SEO-optimized blog article based on this outline:

${params.outline}

Requirements:
- Target word count: ${params.wordCount} words
- Tone: ${params.tone}
- Target audience: ${params.targetAudience}
- Write in HTML format with proper semantic tags
- Include internal linking opportunities (use [LINK: anchor text] placeholders)
- Naturally incorporate the main keyword throughout
- Write engaging, valuable content that provides real insights

Also generate:
1. ${params.titleOptions} compelling SEO-optimized title options
2. A meta description (150-155 characters) that includes the main keyword
3. A focus keyword phrase

Return the response in this JSON format:
{
  "html": "the full article HTML",
  "titles": ["title 1", "title 2", ...],
  "meta_description": "meta description here",
  "focus_keyword": "main keyword phrase"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate article with Anthropic API');
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  // Try to parse JSON from the response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON from response');
  }

  // Fallback if JSON parsing fails
  return {
    html: content,
    titles: [params.topic],
    meta_description: `Learn about ${params.topic}`,
    focus_keyword: params.topic
  };
}

async function generateGmbPost(apiKey: string, params: any): Promise<any> {
  const emojiInstruction = params.includeEmoji ? 'Include relevant emoji to make it engaging.' : 'Do not use emoji.';
  
  const prompt = `Create a Google My Business post with these details:

Topic: ${params.topic}
Post Type: ${params.postType}
CTA Button: ${params.ctaButton}
${emojiInstruction}

Requirements:
- Keep it under 300 characters
- Make it engaging and action-oriented
- ${params.postType === 'offer' ? 'Highlight the value proposition' : ''}
- ${params.postType === 'event' ? 'Include time and date placeholder' : ''}
- End with a strong call-to-action matching the CTA button type

Return ONLY the post text, nothing else.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate GMB post with Anthropic API');
  }

  const data = await response.json();
  return {
    text: data.content[0].text,
    html: `<p>${data.content[0].text}</p>`
  };
}
