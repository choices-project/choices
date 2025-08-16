# Deployment Guide - Clean Vercel Setup

## 🚀 **Current Issue**
The current Vercel deployment is using domains with personal names (e.g., `michaeltempestas-projects.vercel.app`), which is not appropriate for a public project.

## ✅ **Solution: Create New Vercel Project**

### **Step 1: Delete Current Project**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the current project (likely named something with your personal name)
3. Go to Project Settings → General → Delete Project
4. Confirm deletion

### **Step 2: Create New Project**
1. Click "New Project" in Vercel Dashboard
2. Import from GitHub: `choices-project/choices`
3. Configure project:
   - **Project Name**: `choices-platform` (or `choices-voting`)
   - **Framework**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm ci && npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

### **Step 3: Environment Variables**
Add these environment variables in Vercel project settings:
```bash
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-new-domain.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
NEXT_PUBLIC_VAPID_PRIVATE_KEY=your-vapid-private-key
```

### **Step 4: Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Your new clean domains will be:
   - `choices-platform.vercel.app` (or your chosen name)
   - `choices-platform-git-main.vercel.app` (preview deployments)

## 🔧 **What I've Done for You**

### **Disabled GitHub Actions Deployment**
- Commented out Vercel deployment steps in `.github/workflows/vercel-deploy.yml`
- This prevents deployments to the wrong project

### **Updated Vercel Configuration**
- Simplified `vercel.json` to work with automatic deployment
- Removed complex build commands that were causing issues
- Updated CORS headers to be more flexible

### **Added Node.js Engine Specification**
- Added `"engines": { "node": ">=18.0.0" }` to `web/package.json`
- This ensures Vercel uses the correct Node.js version

## 📋 **Next Steps for You**

1. **Follow the steps above** to create the new Vercel project
2. **Test the deployment** to ensure it works correctly
3. **Update any documentation** that references the old domain
4. **Share the new clean domain** with your team/users

## 🎯 **Expected Result**
- Clean, professional domain names
- Automatic deployments on every push to `main`
- No more personal names in URLs
- Proper build process without errors

---

**Note**: The GitHub Actions workflow will still run tests and builds, but won't deploy to Vercel. Vercel will handle deployment automatically when connected to your repository.
