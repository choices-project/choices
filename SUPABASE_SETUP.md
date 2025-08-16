# Supabase Setup Guide for Choices Voting System

## 🎯 Overview

This guide will help you set up Supabase as your database backend for the Choices voting system. Supabase provides a PostgreSQL database with real-time capabilities, authentication, and a powerful API.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher
3. **Git**: For version control

## 🚀 Quick Setup

### Step 1: Run the Setup Script

```bash
./setup-supabase.sh
```

This interactive script will:
- Guide you through getting your Supabase credentials
- Create a `.env.local` file with your configuration
- Test the database connection

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings > API** to find your credentials:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon Key**: Public API key for client-side access
   - **Service Role Key**: Private key for server-side operations
4. Go to **Settings > Database** to find your database password

### Step 3: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/supabase-schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables, indexes, and sample data

### Step 4: Test the Connection

```bash
node test-supabase-connection.js
```

This will verify that:
- Your environment variables are set correctly
- The Supabase client can connect
- Database tables are accessible
- Write operations work properly

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Environment File

Create `.env.local` in your project root:

```bash
# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SUPABASE-SERVICE-ROLE-KEY]"

# Authentication
NEXTAUTH_SECRET="[GENERATE-A-SECURE-RANDOM-STRING]"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 2. Run Database Schema

Copy and run the SQL from `database/supabase-schema.sql` in your Supabase SQL Editor.

## 📊 Database Schema

The schema includes:

### IA Service Tables
- `ia_users`: User information and verification tiers
- `ia_tokens`: VOPRF tokens for voting
- `ia_verification_sessions`: WebAuthn session management
- `ia_webauthn_credentials`: WebAuthn device credentials

### PO Service Tables
- `po_polls`: Poll definitions and metadata
- `po_votes`: Vote records with Merkle commitments
- `po_merkle_trees`: Merkle tree state for verification

### Analytics Tables
- `analytics_events`: Real-time event tracking
- `analytics_demographics`: Anonymized demographic data

## 🔐 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Public read access to polls and vote counts
- Service role access for backend operations
- Authenticated user access for voting

### Authentication
- Supabase Auth integration ready
- WebAuthn support for device-based authentication
- Session management and token handling

## 🧪 Testing

### Connection Test
```bash
node test-supabase-connection.js
```

### Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application running with Supabase.

## 🔄 Migration from SQLite

If you're migrating from SQLite:

1. **Backup your data**: Export any important data from SQLite
2. **Run the schema**: Execute the Supabase schema
3. **Update environment**: Set up `.env.local` with Supabase credentials
4. **Test thoroughly**: Verify all functionality works with Supabase

## 🚀 Production Deployment

### Vercel Deployment
1. Add environment variables to Vercel dashboard
2. Deploy with `vercel --prod`
3. Verify database connection in production

### Other Platforms
- Add environment variables to your hosting platform
- Ensure `DATABASE_URL` and Supabase keys are set
- Test the connection in production environment

## 🔧 Troubleshooting

### Common Issues

#### "Missing environment variables"
- Run `./setup-supabase.sh` to configure environment
- Check that `.env.local` exists and has correct values

#### "Table not found"
- Run the schema in Supabase SQL Editor
- Check that all tables were created successfully

#### "Permission denied"
- Verify RLS policies are set correctly
- Check that service role key is used for backend operations

#### "Connection timeout"
- Check your network connection
- Verify Supabase project is active
- Check firewall settings

### Getting Help

1. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the schema file: `database/supabase-schema.sql`
3. Test connection: `node test-supabase-connection.js`
4. Check environment variables: `cat .env.local`

## 📈 Next Steps

After successful setup:

1. **Test the application**: Verify all features work with Supabase
2. **Monitor performance**: Use Supabase dashboard to monitor queries
3. **Set up backups**: Configure automatic backups in Supabase
4. **Scale as needed**: Supabase handles scaling automatically

## 🎉 Success!

Once you've completed this setup, your Choices voting system will be running on Supabase with:

- ✅ Real-time database updates
- ✅ Automatic scaling
- ✅ Built-in authentication
- ✅ Row-level security
- ✅ Automatic backups
- ✅ Powerful SQL editor
- ✅ Real-time subscriptions

Your voting platform is now ready for production use! 🚀
