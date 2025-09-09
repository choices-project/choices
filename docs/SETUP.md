# Setup

**Created:** December 2024  
**Updated:** September 9, 2025  
*Last Updated: 2025-09-09*

## Requirements
- Node.js 22.19.0 (exact version specified in package.json)
- npm

**Note**: This project uses exact version pinning for stability. Use the specified Node.js version to ensure consistent builds.

## Environment Setup

### Required Environment Variables
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional Environment Variables
```bash
# Civics Data Integrations (Optional)
GOOGLE_CIVIC_API_KEY=
PROPUBLICA_API_KEY=
FEC_API_KEY=

# Redis (Optional - for future use)
REDIS_URL=
```

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd Choices
   
   # Use the correct Node.js version (if using nvm)
   nvm use
   
   npm install
   ```

2. **Set Up Environment**
   ```bash
   # Copy environment template
   cp web/.env.local.example web/.env.local
   
   # Edit with your Supabase credentials
   nano web/.env.local
   ```

3. **Set Up Supabase Database**
   ```bash
   # Clear database for fresh start (optional)
   node scripts/clear-supabase-database.js
   ```

4. **Run Development Server**
   ```bash
   cd web
   npm run dev
   ```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your credentials
3. Update your `.env.local` file with the credentials
4. The database schema will be automatically created

## Production Deployment

The project is configured for Vercel deployment with:
- Automatic builds on Git push to main branch
- Environment variables configured in Vercel dashboard
- Supabase integration ready for production
