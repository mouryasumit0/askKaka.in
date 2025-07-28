import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { logger, trackError } from '@/lib/monitoring'
import { z } from 'zod'

const CreateChatbotSchema = z.object({
  website_url: z.string().url('Invalid website URL'),
  name: z.string().optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = CreateChatbotSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { website_url, name } = validation.data

    // Create chatbot record
    const { data: chatbot, error: createError } = await supabaseAdmin
      .from('chatbots')
      .insert([
        {
          user_id: user.id,
          name: name || 'My Chatbot',
          website_url,
          status: 'training',
          training_progress: 0,
        }
      ])
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create chatbot: ${createError.message}`)
    }

    // Generate script tag
    const scriptTag = `<script>
(function(w,d,s,c){
  w.AskKakaConfig = w.AskKakaConfig || { chatbotId: '${chatbot.id}' };
  var js = d.createElement(s);
  js.src = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/widget/' + c + '.js';
  js.async = true;
  d.head.appendChild(js);
})(window, document, 'script', '${chatbot.id}');
</script>`

    // Update chatbot with script tag
    await supabaseAdmin
      .from('chatbots')
      .update({ script_tag: scriptTag })
      .eq('id', chatbot.id)

    // Start training process asynchronously
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatbot_id: chatbot.id,
        website_url
      })
    }).catch(error => {
      console.error('Failed to start training:', error)
    })

    const responseTime = Date.now() - startTime
    logger.info('Chatbot created successfully', {
      chatbotId: chatbot.id,
      userId: user.id,
      websiteUrl: website_url,
      responseTime
    })

    return NextResponse.json({
      id: chatbot.id,
      status: 'training',
      script_tag: scriptTag
    })

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    trackError(error, { endpoint: '/api/chatbots', method: 'POST', responseTime })
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: chatbots, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ chatbots })

  } catch (error: any) {
    trackError(error, { endpoint: '/api/chatbots', method: 'GET' })
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}