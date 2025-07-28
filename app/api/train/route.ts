import { NextRequest, NextResponse } from 'next/server'
// import { supabaseAdmin } from '@/lib/supabase'
import { WebScraper, chunkContent } from '@/lib/scraper'
import { generateEmbedding } from '@/lib/gemini'
import { logger, trackError } from '@/lib/monitoring'
import { z } from 'zod'
import { createClientAdmin } from '@/lib/supabase/server'

const TrainingRequestSchema = z.object({
  chatbot_id: z.string().uuid('Invalid chatbot ID'),
  website_url: z.string().url('Invalid website URL')
})


export async function POST(request: NextRequest) {
  const supabaseAdmin = await createClientAdmin();
  try {
    const body = await request.json()
    const validation = TrainingRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { chatbot_id, website_url } = validation.data

    // Update chatbot status to training
    await supabaseAdmin
      .from('chatbots')
      .update({ 
        status: 'training', 
        training_progress: 0,
        last_trained_at: new Date().toISOString()
      })
      .eq('id', chatbot_id)

    // Start training process asynchronously
    trainChatbot(chatbot_id, website_url)

    return NextResponse.json({ 
      message: 'Training started',
      chatbot_id,
      status: 'training'
    })

  } catch (error: any) {
    trackError(error, { endpoint: '/api/train', method: 'POST' })
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

async function trainChatbot(chatbotId: string, websiteUrl: string) {
  try {
    const supabaseAdmin = await createClientAdmin();
    logger.info('Starting chatbot training', { chatbotId, websiteUrl })

    // Clear existing content for this chatbot
    await supabaseAdmin
      .from('content_chunks')
      .delete()
      .eq('chatbot_id', chatbotId)

    // Update progress
    await updateTrainingProgress(chatbotId, 10)

    // Scrape website
    const scraper = new WebScraper()
    const pages = await scraper.scrapeWebsite(websiteUrl)
    
    if (pages.length === 0) {
      throw new Error('No content found on website')
    }

    logger.info('Website scraped successfully', { 
      chatbotId, 
      pagesCount: pages.length 
    })

    await updateTrainingProgress(chatbotId, 30)

    // Process each page
    const totalChunks = pages.reduce((acc, page) => {
      const chunks = chunkContent(page.content)
      return acc + chunks.length
    }, 0)

    let processedChunks = 0

    for (const page of pages) {
      const chunks = chunkContent(page.content)
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk)
          
          // Store in database
          await supabaseAdmin
            .from('content_chunks')
            .insert([
              {
                chatbot_id: chatbotId,
                page_url: page.url,
                content: chunk,
                chunk_index: i,
                embedding,
                metadata: {
                  title: page.title,
                  description: page.metadata.description,
                  headings: page.metadata.headings
                }
              }
            ])

          processedChunks++
          
          // Update progress
          const progress = 30 + Math.floor((processedChunks / totalChunks) * 60)
          await updateTrainingProgress(chatbotId, progress)
          
        } catch (error) {
          console.error(`Error processing chunk ${i} from ${page.url}:`, error)
        }
      }
    }

    // Mark as complete
    await supabaseAdmin
      .from('chatbots')
      .update({ 
        status: 'active', 
        training_progress: 100,
        last_trained_at: new Date().toISOString()
      })
      .eq('id', chatbotId)

    logger.info('Chatbot training completed successfully', { 
      chatbotId, 
      totalChunks: processedChunks 
    })

  } catch (error: any) {
    logger.error('Chatbot training failed', { 
      chatbotId, 
      error: error.message 
    })
    const supabaseAdmin = await createClientAdmin();

    // Mark as error
    await supabaseAdmin
      .from('chatbots')
      .update({ 
        status: 'error', 
        training_progress: 0 
      })
      .eq('id', chatbotId)

    trackError(error, { chatbotId, operation: 'training' })
  }
}

async function updateTrainingProgress(chatbotId: string, progress: number) {
  const supabaseAdmin = await createClientAdmin();
  await supabaseAdmin
    .from('chatbots')
    .update({ training_progress: progress })
    .eq('id', chatbotId)
}