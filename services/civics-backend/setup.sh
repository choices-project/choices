#!/bin/bash

# ============================================================================
# CIVICS BACKEND - COMPLETE STANDALONE SETUP
# ============================================================================
# This script sets up the complete civics data ingestion system
# Run this after cloning the repository to get everything working

set -e  # Exit on any error

echo "🚀 Setting up Civics Backend - Complete Standalone System"
echo "=========================================================="

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

echo "📋 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# ============================================================================
# STEP 2: INSTALL DEPENDENCIES
# ============================================================================

echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed"

# ============================================================================
# STEP 3: SETUP ENVIRONMENT
# ============================================================================

echo "🔧 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your API keys and database credentials"
    echo "   Required:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - CONGRESS_GOV_API_KEY"
    echo "   - OPEN_STATES_API_KEY"
    echo "   - FEC_API_KEY"
    echo "   - GOOGLE_CIVIC_API_KEY"
    echo "   - WIKIPEDIA_API_KEY (optional)"
fi

# ============================================================================
# STEP 4: SETUP OPENSTATES DATA
# ============================================================================

echo "🗳️  Setting up OpenStates data..."

# Check if OpenStates data exists
if [ ! -d "data/openstates" ] || [ ! "$(ls -A data/openstates 2>/dev/null)" ]; then
    echo "📥 Downloading OpenStates data..."
    
    # Create data directory
    mkdir -p data/openstates
    
    # Download OpenStates data (this is a placeholder - you'd need the actual download script)
    echo "⚠️  OpenStates data download not implemented in this script"
    echo "   You'll need to manually download OpenStates YAML data to data/openstates/"
    echo "   Visit: https://openstates.org/downloads/"
else
    echo "✅ OpenStates data found"
fi

# ============================================================================
# STEP 5: VERIFY DATABASE CONNECTION
# ============================================================================

echo "🗄️  Verifying database connection..."

# Test database connection
if node scripts/verify-database-connection.js; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "   Please check your .env.local configuration"
    echo "   Make sure your Supabase credentials are correct"
    exit 1
fi

# ============================================================================
# STEP 6: RUN INITIAL SETUP
# ============================================================================

echo "🔨 Running initial setup..."

# Run database setup
if node scripts/setup-database.js; then
    echo "✅ Database setup complete"
else
    echo "❌ Database setup failed"
    exit 1
fi

# ============================================================================
# STEP 7: TEST THE SYSTEM
# ============================================================================

echo "🧪 Testing the system..."

# Run basic tests
if node scripts/test-basic-functionality.js; then
    echo "✅ Basic functionality test passed"
else
    echo "❌ Basic functionality test failed"
    exit 1
fi

# ============================================================================
# STEP 8: COMPLETE SETUP
# ============================================================================

echo ""
echo "🎉 CIVICS BACKEND SETUP COMPLETE!"
echo "=================================="
echo ""
echo "✅ All dependencies installed"
echo "✅ Environment configured"
echo "✅ Database connected"
echo "✅ System tested"
echo ""
echo "🚀 READY TO USE:"
echo "   npm start                    # Run the main pipeline"
echo "   npm run federal             # Process federal representatives"
echo "   npm run state               # Process state representatives"
echo "   npm test                    # Run tests"
echo ""
echo "📚 DOCUMENTATION:"
echo "   README.md                   # Main documentation"
echo "   docs/                       # Detailed guides"
echo ""
echo "🔧 CONFIGURATION:"
echo "   .env.local                  # Your API keys and database config"
echo "   config/                     # Pipeline configuration"
echo ""
echo "Happy data ingesting! 🗳️"
