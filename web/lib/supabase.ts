import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vjwohbnupmizxnyztxik.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database connection string for direct PostgreSQL access
export const DATABASE_URL = process.env.DATABASE_URL

// Helper function to get database connection
export const getDatabaseConnection = () => {
  if (!DATABASE_URL) {
    throw new Error('Missing DATABASE_URL environment variable')
  }
  return DATABASE_URL
}
