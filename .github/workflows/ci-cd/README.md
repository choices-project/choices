# 🚀 CI/CD Workflows

**Core Continuous Integration and Deployment for Choices Platform**

---

## 📋 Overview

This directory contains the essential CI/CD workflows that run on every pull request and deployment.

---

## 🔧 Workflows

### **1. Basic CI** (`basic-ci.yml`)
**Purpose**: Essential checks for Choices platform
- ✅ Type checking
- ✅ Linting  
- ✅ Build verification
- ✅ Security audit
- ✅ Choices-specific tests (user journey, admin journey, database activity)

**Triggers**: Pull requests, push to main

### **2. Simple Deploy** (`simple-deploy.yml`)
**Purpose**: Deploy Choices platform to Vercel
- ✅ Build application
- ✅ Deploy to Vercel
- ✅ Health check
- ✅ Post-deployment tests (platform journey)
- ✅ Civics backend verification

**Triggers**: Push to main

### **3. Type Updates** (`update-types.yml`)
**Purpose**: Keep Supabase database types updated
- ✅ Daily type updates
- ✅ Automatic commits
- ✅ Breaking change detection

**Triggers**: Daily schedule, manual dispatch

---

## 🎯 Usage

These workflows run automatically:
- **Pull Requests**: Basic CI checks
- **Push to Main**: Deploy to production
- **Daily**: Update database types

---

**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready