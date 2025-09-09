#!/usr/bin/env node

/**
 * Supabase Environment Setup Script
 * 
 * This script helps you set up your Supabase environment variables
 * for a clean authentication setup.
 */

import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = '.env.local'

function setupSupabaseEnvironment() {
  console.log('🔧 Setting up Supabase environment...')
  
  // Check if .env.local already exists
  if (existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Backing up to .env.local.backup')
    const backupPath = '.env.local.backup'
    if (existsSync(backupPath)) {
      console.log('   (backup already exists, skipping)')
    } else {
      writeFileSync(backupPath, '')
    }
  }
  
  // Create .env.local template
  const envContent = `# Supabase Configuration
# Get these values from your Supabase project dashboard: https://supabase.com/dashboard

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here

# Your Supabase anon/public key (safe to expose in client-side code)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Your Supabase service role key (KEEP SECRET - server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Alternative naming (some parts of the codebase use these)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
SUPABASE_SECRET_KEY=your_supabase_service_role_key_here

# Admin Configuration (replace with your actual values)
ADMIN_USER_ID=your-admin-user-id-here
ADMIN_USER_EMAIL=your-admin-email@example.com
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com

# Optional: Civics data integrations (fill when ready)
GOOGLE_CIVIC_API_KEY=
PROPUBLICA_API_KEY=
FEC_API_KEY=

# Optional: Redis (for future use)
REDIS_URL=
`

  writeFileSync(envPath, envContent)
  
  console.log('✅ Created .env.local template')
  console.log('\n📋 Next steps:')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Select your project (or create a new one)')
  console.log('3. Go to Settings > API')
  console.log('4. Copy the values and replace the placeholders in .env.local')
  console.log('5. Run: node scripts/clear-database-completely.js')
  console.log('\n🔑 Required values:')
  console.log('   - Project URL (starts with https://)')
  console.log('   - anon/public key (starts with eyJ)')
  console.log('   - service_role key (starts with eyJ)')
}

setupSupabaseEnvironment()



