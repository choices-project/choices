# 📊 Monitoring Workflows

**Health Monitoring and Security Auditing for Choices Platform**

---

## 📋 Overview

This directory contains workflows that monitor the health and security of the Choices platform.

---

## 🔧 Workflows

### **1. Civics Health Check** (`civics-health-check.yml`)
**Purpose**: Monitor civics backend services
- ✅ Daily health checks
- ✅ Representative lookup testing
- ✅ Geographic services validation
- ✅ Data ingestion pipeline monitoring
- ✅ OpenStates API monitoring
- ✅ Google Civic API monitoring

**Triggers**: Daily schedule, manual dispatch

### **2. Security Audit** (`security-audit.yml`)
**Purpose**: Platform-specific security auditing
- ✅ Secret scanning
- ✅ Authentication verification
- ✅ Data protection checks
- ✅ Choices-specific security validation
- ✅ Dependency auditing
- ✅ API security checks

**Triggers**: Weekly schedule, manual dispatch

### **3. CodeQL Alert Summary** (`codeql-alert-summary.yml`)
**Purpose**: Security vulnerability reporting
- ✅ CodeQL analysis results
- ✅ Security alert summaries
- ✅ Vulnerability tracking

**Triggers**: CodeQL analysis completion

---

## 🎯 Usage

These workflows run automatically:
- **Daily**: Civics backend health checks
- **Weekly**: Security audits
- **On Demand**: Manual health checks and security audits

---

**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready
