#!/usr/bin/env node

// Create feedback table using service role key
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🚀 Creating feedback table using service role key...')

// Create the SQL for the feedback table
const createTableSQL = `
-- Create Feedback Table for AI-Optimized Analysis
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    screenshot TEXT,
    user_journey JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance and AI analysis
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feedback_user_journey ON feedback USING GIN(user_journey);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_analysis ON feedback USING GIN(ai_analysis);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);
`

async function createFeedbackTable() {
  try {
    console.log('📋 Executing SQL to create feedback table...')
    
    // Use the service role key to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to create table:', errorText)
      console.log('\n🔧 Manual approach required:')
      console.log('1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb')
      console.log('2. Click "SQL Editor" in the left sidebar')
      console.log('3. Copy and paste this SQL:')
      console.log('\n' + createTableSQL)
      console.log('\n4. Click "Run" button')
      return
    }

    console.log('✅ Feedback table created successfully!')
    
    // Test the table by inserting sample data
    console.log('\n🧪 Testing table with sample data...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const testData = {
      type: 'feature',
      title: 'Test Feedback',
      description: 'This is a test feedback submission',
      sentiment: 'positive',
      user_journey: { page: '/', action: 'test' },
      status: 'open',
      priority: 'medium'
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .insert([testData])
      .select()
    
    if (error) {
      console.error('❌ Test insert failed:', error)
      return
    }
    
    console.log('✅ Test data inserted successfully!')
    console.log('📊 Inserted data:', data)
    
    console.log('\n🎉 Feedback table is ready!')
    console.log('🧪 Test the feedback widget at: http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n🔧 Manual approach required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb')
    console.log('2. Click "SQL Editor" in the left sidebar')
    console.log('3. Copy and paste this SQL:')
    console.log('\n' + createTableSQL)
    console.log('\n4. Click "Run" button')
  }
}

createFeedbackTable()
