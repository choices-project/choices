# Vercel Deployment Configuration Needs

**Created:** December 19, 2024  
**Updated:** December 19, 2024

## 🎯 **Primary Goal**

Configure Vercel deployments to **ONLY** trigger on a successful pull to `main` branch (after manual PR approval), **NOT** on every push to any branch.

## 📋 **Current Situation**

- **Project:** `choices-platform` on Vercel
- **Repository:** `choices-project/choices` on GitHub
- **Current Behavior:** Deployments trigger on every push to any branch
- **Desired Behavior:** Deployments should only trigger when a PR is manually approved and merged to `main`

## 🔍 **What We've Tried**

### **Sections Checked in Vercel Settings:**
1. **Git** - Only shows repository connection and Git LFS settings
2. **Build and Deployment** - Shows rolling releases, production builds, concurrent builds
3. **Deployment Protection** - Shows password protection and authentication settings

### **Settings NOT Found:**
- Production Branch configuration
- Auto Deployments toggle
- Deploy on push controls
- Branch-specific deployment triggers

## 🎯 **Specific Requirements**

### **Deployment Triggers:**
- ✅ **DO deploy when:** PR is manually approved and merged to `main` branch
- ❌ **DON'T deploy when:** 
  - Push to any branch (including `main`)
  - Push to feature branches
  - Push to development branches
  - Any automatic triggers

### **Branch Configuration:**
- **Production Branch:** `main`
- **Preview Branches:** All other branches (but no automatic deployment)
- **Manual Deployment:** Should be possible via Vercel dashboard

## 🔧 **Technical Context**

### **Current Vercel Plan:**
- Appears to be on a free/hobby plan (some features require Pro plan)
- Rolling releases disabled (requires Pro plan)
- Password protection available (requires Pro plan)

### **GitHub Integration:**
- Repository: `choices-project/choices`
- Connected: August 14
- Pull Request Comments: Enabled
- Commit Comments: Disabled
- deployment_status Events: Enabled
- repository_dispatch Events: Enabled

## ❓ **Questions for AI Assistant**

1. **Where exactly are the deployment trigger settings in Vercel?**
   - We've checked Git, Build and Deployment, and Deployment Protection sections
   - None of these show the expected "Production Branch" or "Auto Deployments" settings

2. **Are these settings in a different section we haven't found?**
   - Possible sections: General, Domains, Promotion Requirements, Environments, etc.

3. **Do these settings require a specific Vercel plan?**
   - Some features seem to require Pro plan
   - Are deployment controls part of the free plan?

4. **Is this configuration possible with the current setup?**
   - GitHub repository connected
   - Branch protection rules (if any)
   - Vercel plan limitations

## 🎯 **Expected Outcome**

After configuration:
- Pushing to `main` directly should NOT trigger deployment
- Pushing to feature branches should NOT trigger deployment
- Only manual PR approval and merge to `main` should trigger deployment
- Manual deployments should still be possible via Vercel dashboard

## 📝 **Additional Context**

- This is a Next.js application
- Uses GitHub for version control
- Wants to prevent accidental deployments from direct pushes
- Wants to ensure only reviewed code gets deployed to production
- Current Vercel project: `choices-platform`
- Vercel account: `michaeltempestas-projects`

## 🔗 **Useful Links**

- Vercel Project: `https://vercel.com/michaeltempestas-projects/choices-platform/settings`
- GitHub Repository: `choices-project/choices`
- Current Settings Sections Available:
  - General
  - Build and Deployment
  - Domains
  - Promotion Requirements
  - Environments
  - Environment Variables
  - Git
  - Integrations
  - Deployment Protection
  - Functions
  - Caches
  - Cron Jobs
  - Microfrontends
  - Project Members
  - Drains
  - Security
  - Secure Compute
  - Advanced

---

**Note:** This document was created to help another AI assistant understand the specific Vercel deployment configuration needs and provide targeted guidance on where to find the required settings.
