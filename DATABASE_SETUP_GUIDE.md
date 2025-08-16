# Database Setup Guide

## 🎯 **Overview**

This guide explains how to set up database connectivity for the Choices platform across different environments:
- **Production**: Vercel + Supabase
- **Local Development**: PostgreSQL or Supabase
- **Testing**: Mock data fallbacks

## 🚀 **Production Setup (Vercel + Supabase)**

### **1. Supabase Configuration**
1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Set Vercel Environment Variables**:
   ```bash
   # In Vercel Dashboard → Project Settings → Environment Variables
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=your-supabase-postgres-connection-string
   ```

3. **Database Schema**:
   ```sql
   -- Users table
   CREATE TABLE ia_users (
     id SERIAL PRIMARY KEY,
     stable_id VARCHAR(255) UNIQUE NOT NULL,
     email VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     verification_tier VARCHAR(10) DEFAULT 'T0',
     is_active BOOLEAN DEFAULT TRUE
   );

   -- Polls table
   CREATE TABLE po_polls (
     id SERIAL PRIMARY KEY,
     poll_id VARCHAR(255) UNIQUE NOT NULL,
     title VARCHAR(500) NOT NULL,
     description TEXT,
     options JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     start_time TIMESTAMP NOT NULL,
     end_time TIMESTAMP NOT NULL,
     status VARCHAR(20) DEFAULT 'active',
     sponsors JSONB,
     ia_public_key VARCHAR(500),
     total_votes INTEGER DEFAULT 0,
     participation_rate DECIMAL(5,2) DEFAULT 0
   );

   -- Votes table
   CREATE TABLE po_votes (
     id SERIAL PRIMARY KEY,
     poll_id VARCHAR(255) NOT NULL,
     token VARCHAR(500) NOT NULL,
     tag VARCHAR(100),
     choice INTEGER NOT NULL,
     voted_at TIMESTAMP DEFAULT NOW(),
     merkle_leaf VARCHAR(500),
     merkle_proof JSONB,
     FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id)
   );
   ```

## 💻 **Local Development Setup**

### **Option 1: Local PostgreSQL**

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Ubuntu
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**:
   ```bash
   createdb choices_platform
   ```

3. **Set Environment Variables**:
   ```bash
   # Create .env.local in web/ directory
   LOCAL_DATABASE=true
   LOCAL_DATABASE_URL=postgresql://username:password@localhost:5432/choices_platform
   DATABASE_URL=postgresql://username:password@localhost:5432/choices_platform
   ```

### **Option 2: Local Supabase**

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**:
   ```bash
   supabase init
   supabase start
   ```

3. **Set Environment Variables**:
   ```bash
   # Use the local Supabase credentials
   LOCAL_DATABASE=true
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
   ```

### **Option 3: Mock Data Only**

1. **Set Environment Variables**:
   ```bash
   # No database configuration needed
   LOCAL_DATABASE=false
   # or simply don't set any database variables
   ```

## 🔧 **Environment Variables Reference**

### **Required for Production**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-postgres-connection-string
```

### **Optional for Local Development**
```bash
LOCAL_DATABASE=true                    # Enable local database
LOCAL_DATABASE_URL=postgresql://...    # Local PostgreSQL URL
```

### **Other Required Variables**
```bash
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
NEXT_PUBLIC_VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 🧪 **Testing Database Connectivity**

### **1. Check Database Status**
Visit: `http://localhost:3000/api/database-status`

This will show:
- Current database configuration
- Connection test results
- Environment variables status

### **2. Test API Endpoints**
```bash
# Test polls API
curl http://localhost:3000/api/polls

# Test demographics API
curl http://localhost:3000/api/demographics
```

### **3. Expected Behavior**

**With Database Connected**:
- Real data from database
- Fallback to mock data if database fails

**Without Database**:
- Mock data automatically
- No errors or build failures

## 🔄 **Database Configuration Logic**

The system automatically chooses the database type based on environment:

1. **Production + Vercel + Supabase**: Use Supabase
2. **Local + Database URL**: Use PostgreSQL
3. **Build time or no database**: Use mock data

### **Configuration Priority**:
1. Supabase (if configured and in production)
2. PostgreSQL (if configured and in development)
3. Mock data (fallback)

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Database not connected"**:
   - Check environment variables
   - Verify database is running
   - Check connection strings

2. **"Build fails"**:
   - Ensure mock data fallbacks are working
   - Check for hardcoded database dependencies

3. **"API returns errors"**:
   - Check database status endpoint
   - Verify table schema
   - Check permissions

### **Debug Steps**

1. **Check Environment**:
   ```bash
   echo $NODE_ENV
   echo $LOCAL_DATABASE
   echo $DATABASE_URL
   ```

2. **Test Database Connection**:
   ```bash
   # PostgreSQL
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Supabase
   curl -H "apikey: $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/ia_users?select=count"
   ```

3. **Check API Status**:
   ```bash
   curl http://localhost:3000/api/database-status
   ```

## 📋 **Quick Start Checklist**

### **For Production**:
- [ ] Supabase project created
- [ ] Environment variables set in Vercel
- [ ] Database schema created
- [ ] API endpoints tested

### **For Local Development**:
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] `.env.local` file configured
- [ ] Local development server started
- [ ] Database status endpoint checked

### **For Testing**:
- [ ] Mock data working
- [ ] API endpoints returning data
- [ ] No build errors
- [ ] Frontend displaying correctly

## 🎉 **Success Indicators**

- ✅ Database status endpoint shows correct configuration
- ✅ API endpoints return data (real or mock)
- ✅ No build errors
- ✅ Frontend displays polls and analytics
- ✅ Local development works without database
- ✅ Production uses real database

---

**Note**: The system is designed to gracefully fall back to mock data when the database is not available, ensuring the application always works regardless of database connectivity.
