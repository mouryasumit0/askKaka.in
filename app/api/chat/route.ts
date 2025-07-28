import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse, generateEmbedding } from '@/lib/gemini'
import { detectLanguage, formatResponse } from '@/lib/language'
import { logger, trackChatResponse, trackError } from '@/lib/monitoring'
import { z } from 'zod'
import { createClientAdmin } from '@/lib/supabase/server'

// Allowed origins for CORS
const allowedOrigins = ['null', 'http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:5500']

// Generate CORS headers dynamically
function getCORSHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

const ChatRequestSchema = z.object({
  chatbot_id: z.string().uuid('Invalid chatbot ID'),
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  session_id: z.string().min(1, 'Session ID required'),
  language: z.enum(['en', 'hi', 'hinglish']).optional(),
})

// ⚡ POST handler
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const origin = request.headers.get('origin')
  const corsHeaders = getCORSHeaders(origin)

  try {
    const body = await request.json()
    const validation = ChatRequestSchema.safeParse(body)
    const supabaseAdmin = await createClientAdmin()

    console.log('Chat request body:', body)

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request data', details: validation.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { chatbot_id, message, session_id, language: providedLanguage } = validation.data
    const language = providedLanguage || detectLanguage(message)

    // Check if chatbot exists and is active
    const { data: chatbot, error: chatbotError } = await supabaseAdmin
      .from('chatbots')
      .select('status')
      .eq('id', chatbot_id)
      .single()

    if (chatbotError || !chatbot) {
      return new NextResponse(JSON.stringify({ error: 'Chatbot not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (chatbot.status !== 'active') {
      return new NextResponse(
        JSON.stringify({ error: 'Chatbot is not active', status: chatbot.status }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Find or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('chatbot_id', chatbot_id)
      .eq('session_id', session_id)
      .single()

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert([
          {
            chatbot_id,
            session_id,
            visitor_ip: request.headers.get('x-forwarded-for') || 'unknown',
            started_at: new Date().toISOString(),
            message_count: 0,
          },
        ])
        .select('id')
        .single()

      if (convError) {
        throw new Error('Failed to create conversation')
      }

      conversation = newConversation
    }

    // Save user message
    await supabaseAdmin.from('messages').insert([
      {
        conversation_id: conversation.id,
        message_type: 'user',
        content: message,
        language,
      },
    ])

    // Perform vector search
  const embedding = await generateEmbedding(message) // should return number[]

  const { data: relevantContent, error: searchError } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
    chatbot_filter: chatbot_id,
  })

  if (searchError) console.error(searchError)
  else console.log("sumit o",relevantContent)

    if (searchError) {
      console.error('Vector search error:', searchError)
    }

    console.log('Relevant content found:', relevantContent);
    const context =
      relevantContent?.map((item: { content: string }) => item.content).join('\n\n') ||
      'No relevant information found.'

    // Generate and format bot response
    const rawResponse = await generateChatResponse(context, message, language)
    const formattedResponse = formatResponse(rawResponse, language)
    const responseTime = Date.now() - startTime

    // Save bot message
    await supabaseAdmin.from('messages').insert([
      {
        conversation_id: conversation.id,
        message_type: 'bot',
        content: formattedResponse,
        language,
        response_time_ms: responseTime,
      },
    ])

    // Update message count via function
    await supabaseAdmin
      .from('conversations')
      .update({
        message_count: supabaseAdmin.rpc('increment_message_count', {
          conv_id: conversation.id,
          increment_by: 2,
        }),
      })
      .eq('id', conversation.id)

    // Track analytics
    trackChatResponse(chatbot_id, responseTime, language)

    return new NextResponse(
      JSON.stringify({
        response: formattedResponse,
        language,
        response_time_ms: responseTime,
        conversation_id: conversation.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    trackError(error, {
      endpoint: '/api/chat',
      method: 'POST',
      responseTime,
    })

    return new NextResponse(
      JSON.stringify({
        error: 'Failed to process message',
        response:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        language: 'en',
        response_time_ms: responseTime,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
}

// ⚙️ Preflight request handler
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  const corsHeaders = getCORSHeaders(origin)
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
