import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database types
export interface Profile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  website_url?: string
  created_at: string
  updated_at: string
}

export interface Chatbot {
  id: string
  user_id: string
  name: string
  website_url: string
  status: 'inactive' | 'training' | 'active' | 'error'
  training_progress: number
  last_trained_at?: string
  script_tag?: string
  created_at: string
  updated_at: string
}

export interface ContentChunk {
  id: string
  chatbot_id: string
  page_url: string
  content: string
  chunk_index: number
  embedding?: number[]
  metadata?: any
  created_at: string
}

export interface Conversation {
  id: string
  chatbot_id: string
  session_id: string
  visitor_ip?: string
  visitor_location?: string
  started_at: string
  ended_at?: string
  message_count: number
}

export interface Message {
  id: string
  conversation_id: string
  message_type: 'user' | 'bot'
  content: string
  language: string
  response_time_ms?: number
  created_at: string
}

export interface UsageStats {
  id: string
  chatbot_id: string
  date: string
  total_conversations: number
  total_messages: number
  avg_response_time_ms?: number
  languages_used: Record<string, number>
  created_at: string
}