#!/bin/bash

# Setup and Run OpenStates Population Script
# This script will install dependencies and run the population script

echo "🚀 Setting up OpenStates Population Script..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to scripts directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f "../.env.local" ]; then
    echo "⚠️  .env.local file not found. Creating template..."
    cat > ../.env.local << EOF
# Supabase Configuration
SUPABASE_URL=your-supabase-url-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Example:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
    echo "📝 Please edit .env.local with your Supabase credentials and run again."
    exit 1
fi

# Load environment variables
source ../.env.local

# Check if Supabase credentials are set
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "your-supabase-url-here" ]; then
    echo "❌ Please set SUPABASE_URL in .env.local"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your-service-role-key-here" ]; then
    echo "❌ Please set SUPABASE_SERVICE_ROLE_KEY in .env.local"
    exit 1
fi

echo "✅ Environment configured correctly"
echo "🔄 Starting population process..."

# Run the population script
node populate-openstates-current.js

echo "🎉 Population complete!"
