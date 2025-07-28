import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/gemini'
import { detectLanguage, formatResponse } from '@/lib/language'
import { logger, trackChatResponse, trackError } from '@/lib/monitoring'
import { z } from 'zod'

const ChatRequestSchema = z.object({
  chatbot_id: z.string().uuid('Invalid chatbot ID'),
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  session_id: z.string().min(1, 'Session ID required'),
  language: z.enum(['en', 'hi', 'hinglish']).optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse and validate request
    const body = await request.json()
    const validation = ChatRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { chatbot_id, message, session_id, language: providedLanguage } = validation.data

    // Detect language if not provided
    const language = providedLanguage || detectLanguage(message)

    // Check if chatbot exists and is active
    const { data: chatbot, error: chatbotError } = await supabaseAdmin
      .from('chatbots')
      .select('status')
      .eq('id', chatbot_id)
      .single()

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    if (chatbot.status !== 'active') {
      return NextResponse.json({ 
        error: 'Chatbot is not active',
        status: chatbot.status
      }, { status: 400 })
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
            message_count: 0
          }
        ])
        .select('id')
        .single()

      if (convError) {
        throw new Error('Failed to create conversation')
      }

      conversation = newConversation
    }

    // Save user message
    await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: conversation.id,
          message_type: 'user',
          content: message,
          language
        }
      ])

    // Find relevant content using vector search
    const { data: relevantContent, error: searchError } = await supabaseAdmin
      .rpc('match_documents', {
        query_embedding: await import('@/lib/gemini').then(m => m.generateEmbedding(message)),
        match_threshold: 0.7,
        match_count: 5,
        chatbot_filter: chatbot_id
      })

    if (searchError) {
      console.error('Vector search error:', searchError)
    }

    // Prepare context from relevant content
    const context = relevantContent
      ?.map(item => item.content)
      .join('\n\n') || 'No relevant information found.'

    // Generate response
    const rawResponse = await generateChatResponse(context, message, language)
    const formattedResponse = formatResponse(rawResponse, language)

    const responseTime = Date.now() - startTime

    // Save bot message
    await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: conversation.id,
          message_type: 'bot',
          content: formattedResponse,
          language,
          response_time_ms: responseTime
        }
      ])

    // Update conversation message count
    await supabaseAdmin
      .from('conversations')
      .update({ 
        message_count: supabaseAdmin.raw('message_count + 2') // user + bot message
      })
      .eq('id', conversation.id)

    // Track analytics
    trackChatResponse(chatbot_id, responseTime, language)

    return NextResponse.json({
      response: formattedResponse,
      language,
      response_time_ms: responseTime,
      conversation_id: conversation.id
    })

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    trackError(error, { 
      endpoint: '/api/chat', 
      method: 'POST', 
      responseTime 
    })

    return NextResponse.json({
      error: 'Failed to process message',
      response: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
      language: 'en',
      response_time_ms: responseTime
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}