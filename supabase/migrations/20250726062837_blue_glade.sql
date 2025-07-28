/*
  # Initial Schema Setup for AskKaka.in
  
  1. New Tables
    - `profiles` - User profile information
    - `chatbots` - Chatbot configuration and status
    - `content_chunks` - Website content with embeddings
    - `conversations` - Chat conversation tracking
    - `messages` - Individual chat messages
    - `usage_stats` - Analytics and usage data
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Create necessary indexes for performance
    
  3. Extensions
    - Enable vector extension for embeddings
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbots configuration
CREATE TABLE IF NOT EXISTS chatbots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Chatbot',
  website_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('inactive', 'training', 'active', 'error')) DEFAULT 'inactive',
  training_progress INTEGER DEFAULT 0,
  last_trained_at TIMESTAMP WITH TIME ZONE,
  script_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website content chunks for vector storage
CREATE TABLE IF NOT EXISTS content_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations tracking
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  visitor_ip TEXT,
  visitor_location TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0
);

-- Individual messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_type TEXT CHECK (message_type IN ('user', 'bot')) NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL,
  languages_used JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chatbot_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_status ON chatbots(status);
CREATE INDEX IF NOT EXISTS idx_content_chunks_chatbot_id ON content_chunks(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_chatbot_date ON usage_stats(chatbot_id, date);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding ON content_chunks USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own chatbots" ON chatbots FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content chunks" ON content_chunks FOR SELECT 
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own content chunks" ON content_chunks FOR ALL 
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT 
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE user_id = auth.uid()));
CREATE POLICY "Public can create conversations" ON conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT 
  USING (conversation_id IN (
    SELECT c.id FROM conversations c 
    JOIN chatbots cb ON cb.id = c.chatbot_id 
    WHERE cb.user_id = auth.uid()
  ));
CREATE POLICY "Public can create messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own usage stats" ON usage_stats FOR ALL 
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE user_id = auth.uid()));

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  chatbot_filter uuid
)
RETURNS TABLE(
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    content_chunks.id,
    content_chunks.content,
    content_chunks.metadata,
    1 - (content_chunks.embedding <=> query_embedding) AS similarity
  FROM content_chunks
  WHERE 
    chatbot_id = chatbot_filter
    AND 1 - (content_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY content_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;