// Database Configuration and Connection Management
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isBuildTime = isProduction && !process.env.VERCEL_URL
export const isLocalDevelopment = isDevelopment && process.env.LOCAL_DATABASE === 'true'

// Database configuration
export interface DatabaseConfig {
  type: 'supabase' | 'postgres' | 'mock'
  url?: string
  enabled: boolean
  fallbackToMock: boolean
}

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const DATABASE_URL = process.env.DATABASE_URL
const LOCAL_DATABASE_URL = process.env.LOCAL_DATABASE_URL

// Database configuration based on environment
export const getDatabaseConfig = (): DatabaseConfig => {
  // If Supabase is configured, use it (both production and development)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return {
      type: 'supabase',
      url: SUPABASE_URL,
      enabled: true,
      fallbackToMock: true
    }
  }

  // Production with Vercel - use Supabase
  if (isProduction && process.env.VERCEL_URL && SUPABASE_URL && SUPABASE_ANON_KEY) {
    return {
      type: 'supabase',
      url: SUPABASE_URL,
      enabled: true,
      fallbackToMock: true
    }
  }

  // Local development with PostgreSQL
  if (isLocalDevelopment && (DATABASE_URL || LOCAL_DATABASE_URL)) {
    return {
      type: 'postgres',
      url: LOCAL_DATABASE_URL || DATABASE_URL,
      enabled: true,
      fallbackToMock: true
    }
  }

  // Build time or no database - use mock
  if (isBuildTime || !DATABASE_URL) {
    return {
      type: 'mock',
      enabled: false,
      fallbackToMock: true
    }
  }

  // Default fallback
  return {
    type: 'mock',
    enabled: false,
    fallbackToMock: true
  }
}

// Supabase client
export const createSupabaseClient = (): SupabaseClient | null => {
  const config = getDatabaseConfig()
  
  if (config.type !== 'supabase' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  })
}

// PostgreSQL client
export const createPostgresClient = (): Pool | null => {
  const config = getDatabaseConfig()
  
  if (config.type !== 'postgres' || !config.url) {
    return null
  }

  return new Pool({
    connectionString: config.url,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Database connection status
export const getDatabaseStatus = () => {
  const config = getDatabaseConfig()
  
  return {
    environment: process.env.NODE_ENV,
    isLocalDevelopment,
    isBuildTime,
    databaseType: config.type,
    databaseEnabled: config.enabled,
    fallbackToMock: config.fallbackToMock,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    postgresConfigured: !!(DATABASE_URL || LOCAL_DATABASE_URL),
    vercelUrl: process.env.VERCEL_URL
  }
}

// Database connection test
export const testDatabaseConnection = async () => {
  const config = getDatabaseConfig()
  
  if (config.type === 'supabase') {
    const supabase = createSupabaseClient()
    if (!supabase) return { success: false, error: 'Supabase client not configured' }
    
    try {
      const { error } = await supabase.from('ia_users').select('count').limit(1)
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error' }
    }
  }
  
  if (config.type === 'postgres') {
    const pool = createPostgresClient()
    if (!pool) return { success: false, error: 'PostgreSQL client not configured' }
    
    try {
      const client = await pool.connect()
      await client.query('SELECT 1')
      client.release()
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error' }
    }
  }
  
  return { success: true, error: null, mock: true }
}

// Export instances
export const supabase = createSupabaseClient()
export const postgresPool = createPostgresClient()
export const dbConfig = getDatabaseConfig()
