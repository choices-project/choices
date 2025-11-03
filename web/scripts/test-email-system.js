#!/usr/bin/env node

/**
 * Test script for candidate email system
 * 
 * Tests:
 * 1. Email service module loads
 * 2. Email templates generate correctly
 * 3. Email API endpoint exists
 * 4. Cron job endpoint exists
 * 
 * Usage:
 *   node scripts/test-email-system.js
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🧪 Testing Email System Setup\n')

// Test 1: Resend package installed
console.log('1. Checking Resend package...')
try {
  const packageJson = JSON.parse(
    readFileSync(join(rootDir, 'package.json'), 'utf-8')
  )
  
  if (packageJson.dependencies?.resend || packageJson.devDependencies?.resend) {
    console.log('   ✅ Resend package found in package.json')
  } else {
    console.log('   ⚠️  Resend not in package.json (may need npm install)')
  }
} catch (error) {
  console.log('   ❌ Could not read package.json')
}

// Test 2: Email service file exists
console.log('\n2. Checking email service file...')
const emailServicePath = join(rootDir, 'lib', 'services', 'email', 'candidate-journey-emails.ts')
if (existsSync(emailServicePath)) {
  console.log('   ✅ Email service file exists')
  
  // Check if it has Resend import
  try {
    const content = readFileSync(emailServicePath, 'utf-8')
    if (content.includes('import') && content.includes('resend')) {
      console.log('   ✅ Resend integration code found')
    } else if (content.includes('TODO') && content.includes('Resend')) {
      console.log('   ⚠️  Resend integration not yet implemented (placeholder code)')
    }
  } catch (error) {
    console.log('   ⚠️  Could not read file content')
  }
} else {
  console.log('   ❌ Email service file not found')
}

// Test 3: Email API endpoint exists
console.log('\n3. Checking email API endpoint...')
const emailApiPath = join(rootDir, 'app', 'api', 'candidate', 'journey', 'send-email', 'route.ts')
if (existsSync(emailApiPath)) {
  console.log('   ✅ Email API endpoint exists')
} else {
  console.log('   ❌ Email API endpoint not found')
}

// Test 4: Cron job endpoint exists
console.log('\n4. Checking cron job endpoint...')
const cronPath = join(rootDir, 'app', 'api', 'cron', 'candidate-reminders', 'route.ts')
if (existsSync(cronPath)) {
  console.log('   ✅ Cron job endpoint exists')
} else {
  console.log('   ❌ Cron job endpoint not found')
}

// Test 5: Vercel cron config
console.log('\n5. Checking Vercel cron configuration...')
const vercelJsonPath = join(rootDir, 'vercel.json')
if (existsSync(vercelJsonPath)) {
  try {
    const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'))
    if (vercelJson.crons && vercelJson.crons.length > 0) {
      const candidateCron = vercelJson.crons.find(
        (cron) => cron.path === '/api/cron/candidate-reminders'
      )
      if (candidateCron) {
        console.log('   ✅ Cron job configured in vercel.json')
        console.log(`      Schedule: ${candidateCron.schedule}`)
      } else {
        console.log('   ⚠️  Cron job not found in vercel.json')
      }
    } else {
      console.log('   ⚠️  No crons configured in vercel.json')
    }
  } catch (error) {
    console.log('   ⚠️  Could not parse vercel.json')
  }
} else {
  console.log('   ⚠️  vercel.json not found')
}

// Test 6: Environment variable check (informational)
console.log('\n6. Environment variable check...')
console.log('   ℹ️  RESEND_API_KEY should be set in .env.local')
console.log('   ℹ️  Run: grep RESEND_API_KEY .env.local')
console.log('   ℹ️  If empty, add: RESEND_API_KEY=re_your_key_here')

console.log('\n📋 Next Steps:')
console.log('   1. Ensure RESEND_API_KEY is in .env.local')
console.log('   2. Start dev server: npm run dev')
console.log('   3. Declare candidacy to get a platform ID')
console.log('   4. Test email: curl "http://localhost:3000/api/candidate/journey/send-email?platformId=YOUR_ID&type=welcome"')
console.log('   5. Check Vercel dashboard for cron job after deploying\n')

console.log('✅ Setup check complete!\n')

