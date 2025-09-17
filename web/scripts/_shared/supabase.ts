// scripts/_shared/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env.local explicitly
config({ path: '.env.local' })

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SECRET_KEY!
  if (!url || !key) throw new Error('Supabase env not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}
