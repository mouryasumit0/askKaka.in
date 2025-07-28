import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Models for different tasks
const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

export async function generateChatResponse(
  context: string,
  question: string,
  language: 'en' | 'hi' | 'hinglish'
): Promise<string> {
  try {
    let prompt = ''
    
    switch (language) {
      case 'hi':
        prompt = `आप एक सहायक चैटबॉट हैं। निम्नलिखित संदर्भ के आधार पर उपयोगकर्ता के प्रश्न का उत्तर दें।

संदर्भ: ${context}

प्रश्न: ${question}

कृपया संक्षिप्त और सहायक उत्तर दें। यदि संदर्भ में जानकारी नहीं है, तो विनम्रता से बताएं कि आप मदद नहीं कर सकते।`
        break
        
      case 'hinglish':
        prompt = `You are a helpful chatbot. Answer the user's question based on the following context in a friendly Hinglish style (mixing Hindi and English naturally).

Context: ${context}

Question: ${question}

Please provide a helpful response. If the information is not available in the context, politely say that you cannot help with that specific question.`
        break
        
      default:
        prompt = `You are a helpful chatbot. Answer the user's question based on the following context.

Context: ${context}

Question: ${question}

Please provide a concise and helpful response. If the information is not available in the context, politely say that you cannot help with that specific question.`
    }

    console.log('Generating response with prompt:', prompt)
    const result = await textModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating chat response:', error)
    throw new Error('Failed to generate response')
  }
}