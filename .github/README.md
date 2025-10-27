# 🚀 GitHub Actions for Choices Platform

**Solo Developer CI/CD for Democratic Engagement Platform**

---

## 📋 Overview

This directory contains the essential GitHub Actions workflows for the Choices platform - a democratic engagement platform focused on civic participation, polling, and representative engagement.

---

## 🎯 What You Get

### **4 Essential Workflows**

#### **1. Basic CI** (`workflows/simple/basic-ci.yml`)
**Purpose**: Essential checks for Choices platform
- ✅ Type checking
- ✅ Linting
- ✅ Build verification
- ✅ Security audit
- ✅ **Choices-specific tests** (user journey, admin journey, database activity)

**Triggers**: Pull requests, push to main

#### **2. Simple Deploy** (`workflows/simple/simple-deploy.yml`)
**Purpose**: Deploy Choices platform to Vercel
- ✅ Build application
- ✅ Deploy to Vercel
- ✅ Health check
- ✅ **Post-deployment tests** (platform journey)
- ✅ **Civics backend verification**

**Triggers**: Push to main

#### **3. Type Updates** (`workflows/simple/update-types.yml`)
**Purpose**: Keep Supabase database types updated
- ✅ Daily type updates
- ✅ Automatic commits
- ✅ Breaking change detection

**Triggers**: Daily schedule, manual dispatch

#### **4. Documentation Automation** (`workflows/documentation-automation.yml`)
**Purpose**: Automated documentation maintenance
- ✅ Weekly documentation updates
- ✅ Link validation
- ✅ Content quality checks

**Triggers**: Weekly schedule, manual dispatch

### **2 Specialized Workflows**

#### **5. Civics Backend Health Check** (`workflows/civics-backend-health.yml`)
**Purpose**: Monitor civics backend services
- ✅ Daily health checks
- ✅ Representative lookup testing
- ✅ Geographic services validation
- ✅ Data ingestion pipeline monitoring

**Triggers**: Daily schedule, manual dispatch

#### **6. Choices Security Audit** (`workflows/choices-security.yml`)
**Purpose**: Platform-specific security auditing
- ✅ Secret scanning
- ✅ Authentication verification
- ✅ Data protection checks
- ✅ Choices-specific security validation

**Triggers**: Weekly schedule, manual dispatch

---

## 🔧 Quick Setup

### **1. Configure Secrets**
Add these to your GitHub repository (Settings → Secrets and variables → Actions):

```yaml
# Vercel (for deployment)
VERCEL_TOKEN: "your-vercel-token"
VERCEL_ORG_ID: "your-vercel-org-id"
VERCEL_PROJECT_ID: "your-vercel-project-id"

# Supabase (for type updates)
SUPABASE_ACCESS_TOKEN: "your-supabase-access-token"

# Optional: Civics APIs
OPENSTATES_API_KEY: "your-openstates-api-key"
GOOGLE_CIVIC_API_KEY: "your-google-civic-api-key"
```

### **2. Set Up Branch Protection**
Add these status checks to your branch protection rules:
- `basic-ci` (required for all branches)
- `simple-deploy` (required for main branch)
- `documentation-automation` (required for main branch)

### **3. Test the Workflows**
```bash
# Test basic CI
gh workflow run basic-ci.yml

# Test simple deployment
gh workflow run simple-deploy.yml

# Test civics backend health
gh workflow run civics-backend-health.yml

# Test security audit
gh workflow run choices-security.yml
```

---

## 💰 Cost

### **GitHub Actions (Free Tier)**
- **2,000 minutes/month** for private repos
- **Unlimited minutes** for public repos
- **Basic CI**: ~5-10 minutes per run
- **Simple Deploy**: ~3-5 minutes per run
- **Type Updates**: ~2-3 minutes per run
- **Civics Health Check**: ~2-3 minutes per run
- **Security Audit**: ~5-10 minutes per run

**Total**: ~50-100 minutes/month (well within free tier)

---

## 🚀 Usage

### **Automatic**
- **Pull Requests**: Run basic CI checks with Choices-specific tests
- **Push to Main**: Deploy to production with civics backend verification
- **Daily**: Update database types and check civics backend health
- **Weekly**: Run security audit and update documentation

### **Manual**
```bash
# Run civics backend health check
gh workflow run civics-backend-health.yml

# Run security audit
gh workflow run choices-security.yml

# Force type update
gh workflow run update-types.yml -f force_update=true
```

---

## 🎯 Benefits

### **✅ Choices-Specific**
- **Platform-focused testing**: User journey, admin journey, database activity
- **Civics backend monitoring**: Health checks for OpenStates, Google Civic API
- **Security validation**: Platform-specific security auditing
- **Documentation automation**: Automated maintenance of comprehensive docs

### **✅ Solo Developer Optimized**
- **Minimal complexity**: Only essential functionality
- **Cost-effective**: Uses free tiers effectively
- **Easy maintenance**: Clear, focused workflows
- **Future-proof**: Enterprise setup archived for scaling

### **✅ Professional Quality**
- **Comprehensive testing**: All critical paths covered
- **Security focused**: Regular security audits
- **Health monitoring**: Proactive issue detection
- **Documentation**: Automated maintenance

---

## 📈 When to Scale Up

### **Add More Testing When**:
- You have multiple contributors
- You're handling sensitive user data
- You need reliability guarantees
- You have budget for more GitHub Actions minutes

### **Add Security Scanning When**:
- You're handling sensitive data
- You have compliance requirements
- You have budget for security tools
- You're ready to invest in security

### **Add Complex Deployment When**:
- You need staging environments
- You have multiple services
- You need rollback capabilities
- You have budget for infrastructure

---

## 🆘 Troubleshooting

### **Common Issues**
1. **Secrets not found**: Check secret names and permissions
2. **Build failures**: Check dependency versions and configurations
3. **Deployment failures**: Check Vercel configuration and permissions
4. **Civics backend failures**: Check API keys and rate limits
5. **Security audit failures**: Review hardcoded secrets and authentication

### **Debugging Steps**
1. Check workflow logs in the Actions tab
2. Review artifact contents
3. Test locally with same configurations
4. Check environment variables and secrets
5. Verify civics backend API endpoints

---

## 📚 Documentation

### **Current Setup**
- **Simple Workflows**: `workflows/simple/README.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Solo Developer Setup**: `SOLO_DEVELOPER_SETUP.md`
- **Choices Optimization**: `CHOICES_OPTIMIZATION_RECOMMENDATIONS.md`

### **Future Directions**
- **Enterprise Setup**: `future-directions/enterprise-setup-2025-10-27/`
- **Complex Workflows**: Archived for future use
- **Advanced Features**: Available when you need them

---

## 📞 Support

### **Resources**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Choices Platform Documentation](../docs/README.md)

### **Getting Help**
- Check workflow logs in the Actions tab
- Review the troubleshooting section above
- Test locally with same configurations
- Check Choices platform documentation

---

**Setup Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Choices Platform Ready

---

*This setup gives you professional CI/CD specifically tailored for the Choices platform, perfect for solo development on freemium services.*