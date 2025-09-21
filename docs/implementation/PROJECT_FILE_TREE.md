# Project File Tree Tracker

**Created:** 2025-01-19  
**Last Updated:** 2025-09-20  
**Status:** Active Project Structure  
**Purpose:** Track all files associated with the implementation roadmap
**Location:** `/docs/implementation/PROJECT_FILE_TREE.md`

---

## 🎯 **Overview**

This document tracks the complete file structure of the Choices project. Agents must update this file after each successful implementation.

## 📊 **Current Implementation Status**

### **🟢 Enhanced Onboarding System - COMPLETED**
- ✅ **Components Restored**: Enhanced onboarding components from backup
- ✅ **Feature Flag Enabled**: ENHANCED_ONBOARDING = true
- ✅ **E2E Tests Created**: Comprehensive test suite for 9-step flow
- ✅ **User Journey Updated**: Tests updated for enhanced flow
- ✅ **Validation Complete**: E2E test validation successful
- ✅ **Surgical Fix Applied**: Form binding issue resolved
- ✅ **Server Action Working**: Direct binding with E2E bypass
- ✅ **Archive Complete**: Simple onboarding components archived

### **🟢 Superior Poll System - COMPLETED**
- ✅ **System Implemented**: Comprehensive poll wizard with 4-step process
- ✅ **Legacy System Archived**: Basic poll form backed up to `archive/inferior-poll-system/`
- ✅ **Active System**: Poll creation uses professional 4-step wizard
- ✅ **Feature Flag Enabled**: ENHANCED_POLLS = true
- ✅ **Advanced Features**: 6 voting methods, 13 categories, professional UI
- ✅ **Tests Updated**: Poll management tests updated for wizard system
- ✅ **Integration Complete**: Works with enhanced onboarding flow

### **🟢 Enhanced Profile System - COMPLETED**
- ✅ **System Implemented**: Comprehensive profile management with editing capabilities
- ✅ **Legacy System Archived**: Basic profile backed up to `archive/obsolete-profile/`
- ✅ **Active System**: Profile page + edit page with advanced features
- ✅ **Feature Flag Enabled**: ENHANCED_PROFILE = true
- ✅ **API Endpoints Created**: `/api/profile/avatar`, `/api/profile/update`, `/api/auth/delete-account`
- ✅ **Components Restored**: `BiometricSetup` component and `useAuth` hook
- ✅ **Client/Server Separation**: Proper API endpoints with server-side validation
- ✅ **Advanced Features**: Profile editing, avatar upload, privacy controls, biometric management, data export, account deletion
- ✅ **E2E Testing**: All 30 tests passing across all browsers and devices
- ✅ **UI Components**: Created missing components (Textarea, Avatar, Switch)
- ✅ **Technical Fixes**: Fixed syntax errors, hydration guards, authentication flow

### **🟢 Enhanced Dashboard System - COMPLETED**
- ✅ **System Implemented**: User-centric dashboard with personal analytics and insights
- ✅ **Legacy System Archived**: Basic dashboard and analytics dashboard backed up to `archive/obsolete-dashboard/`
- ✅ **Active System**: Enhanced dashboard with user metrics, trends, insights, and engagement
- ✅ **Feature Flag Enabled**: ENHANCED_DASHBOARD = true
- ✅ **API Endpoint Created**: `/api/dashboard/data` for user-specific dashboard data
- ✅ **User-Centric Design**: Personal polls, votes, trust score, achievements, and activity trends
- ✅ **Advanced Features**: Multiple views (Activity, Trends, Insights, Engagement), real-time data, responsive design
- ✅ **E2E Testing**: Comprehensive test suite for all dashboard functionality
- ✅ **Technical Implementation**: Proper data fetching, error handling, loading states, and navigation

### **📁 Documentation Organization - COMPLETED**
- ✅ **Core Docs Updated**: All documentation moved to `/docs/`
- ✅ **Implementation Guides**: Organized in `/docs/implementation/`
- ✅ **Future Features**: Organized in `/docs/future-features/`
- ✅ **Scratch Directory**: Created for temporary files
- ✅ **Main README**: Updated with current project state

---

## 📁 **Current Project Structure**

### **Root Directory**
```
/Users/alaughingkitsune/src/Choices/
├── README.md                                 # Main project documentation
├── docs/                                     # All documentation organized
│   ├── implementation/                       # Current implementation guides
│   │   ├── MASTER_IMPLEMENTATION_ROADMAP.md # Master roadmap for agents
│   │   ├── PROJECT_FILE_TREE.md             # This file - project structure tracker
│   │   ├── COMPREHENSIVE_IMPLEMENTATION_ROADMAP.md
│   │   ├── COMPONENT_MIGRATION_GUIDE.md
│   │   ├── FEATURE_FLAGS_DOCUMENTATION.md
│   │   └── IMPLEMENTATION_SUMMARY.md
│   ├── future-features/                      # Future feature documentation
│   │   ├── SOCIAL_SHARING_IMPLEMENTATION_PLAN.md
│   │   ├── SOCIAL_SHARING_MASTER_ROADMAP.md
│   │   ├── CIVICS_ADDRESS_LOOKUP_ROADMAP.md
│   │   ├── CIVICS_COMPREHENSIVE.md
│   │   ├── CIVICS_TESTING_STRATEGY.md
│   │   └── CONTACT_INFORMATION_SYSTEM.md
│   ├── core/                                 # Core system documentation
│   │   ├── ADMIN_SYSTEM_IMPLEMENTATION.md
│   │   ├── AUTHENTICATION_COMPREHENSIVE.md
│   │   ├── DATABASE_SCHEMA_COMPREHENSIVE.md
│   │   ├── FEATURE_FLAGS_COMPREHENSIVE.md
│   │   ├── PROJECT_COMPREHENSIVE_OVERVIEW.md
│   │   ├── SECURITY_COMPREHENSIVE.md
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── TYPESCRIPT_AGENT_GUIDE.md
│   │   ├── VOTING_ENGINE_COMPREHENSIVE.md
│   │   └── WEBAUTHN_IMPLEMENTATION_COMPREHENSIVE.md
│   ├── archive/                              # Archived documentation
│   │   ├── analysis-files/                   # Analysis and audit files
│   │   └── outdated-core/                    # Outdated core documentation
│   ├── UNIFIED_PLAYBOOK.md                   # Complete system playbook
│   ├── ONBOARDING.md                         # Project onboarding guide
│   ├── COMPREHENSIVE_SYSTEM_ARCHITECTURE_DISCOVERY.md
│   ├── COMPREHENSIVE_MVP_DOCUMENTATION.md
│   ├── PROJECT_STATUS_REPORT.md
│   ├── ROADMAP.md
│   ├── TESTING_GUIDE.md
│   ├── E2E_TESTING_PATTERNS.md
│   ├── PRODUCTION_READINESS.md
│   ├── SECURITY_INCIDENTS.md
│   ├── CONTRIBUTING.md
│   └── CURRENT_STATUS.md
├── web/                                      # Main web application
├── scratch/                                  # Temporary files (clean regularly)
└── archive/                                  # Archived components (future)
```

### **Web Application Structure**
```
web/
├── app/                                      # Next.js app router
│   ├── (app)/                               # Protected app routes
│   │   ├── dashboard/                       # Dashboard page
│   │   ├── polls/                           # Polls pages
│   │   │   ├── create/                      # Poll creation
│   │   │   └── [id]/                        # Individual poll pages
│   │   ├── profile/                         # Profile pages
│   │   │   ├── page.tsx                     # Profile display
│   │   │   └── edit/                        # Profile editing
│   │   └── layout.tsx                       # App layout
│   ├── api/                                 # API routes
│   │   ├── auth/                            # Authentication APIs
│   │   ├── polls/                           # Poll APIs
│   │   ├── pwa/                             # PWA APIs
│   │   └── e2e/                             # E2E testing APIs
│   ├── auth/                                # Authentication pages
│   │   ├── login/                           # Login page
│   │   └── register/                        # Registration page
│   ├── civics/                              # Civics page
│   ├── onboarding/                          # Onboarding page
│   ├── p/                                   # Public poll pages
│   ├── layout.tsx                           # Root layout
│   └── not-found.tsx                        # Not found page
├── components/                               # Reusable UI components
│   ├── auth/                                # Auth-related components
│   ├── civics/                              # Civics-related components
│   ├── onboarding/                          # Onboarding components
│   │   ├── components/                      # Sub-components for onboarding
│   │   ├── steps/                           # Individual onboarding steps
│   │   ├── EnhancedOnboardingFlow.tsx       # Enhanced onboarding flow
│   │   └── SimpleOnboardingFlow.tsx.backup  # Backed up simple onboarding
│   ├── polls/                               # Poll-related components
│   ├── pwa/                                 # PWA-related components
│   ├── social/                              # Social sharing components (mostly disabled)
│   └── ui/                                  # Generic UI components
├── features/                                 # Feature-specific modules
│   ├── auth/                                # Auth features
│   ├── polls/                               # Poll features
│   └── pwa/                                 # PWA features
├── hooks/                                    # Custom React hooks
├── lib/                                      # Utility functions and libraries
│   ├── core/                                # Core utilities
│   │   ├── auth/                            # Auth utilities
│   │   ├── feature-flags.ts                 # Feature flag definitions
│   │   └── logger.ts                        # Logging utility
│   ├── pwa/                                 # PWA utilities
│   ├── testing/                             # Testing utilities
│   │   └── testIds.ts                       # Test ID registry
│   └── utils/                               # General utilities
├── public/                                   # Static assets
│   ├── icons/                               # PWA icons
│   └── sw.js                                # Service worker
├── styles/                                   # Global styles
├── tests/                                    # E2E tests
│   ├── e2e/                                 # Playwright E2E tests
│   │   ├── enhanced-onboarding.spec.ts      # New enhanced onboarding tests
│   │   └── user-journeys.spec.ts            # Updated user journey tests
│   └── unit/                                # Jest unit tests
└── utils/                                    # Helper functions
```

### **Database Structure**
```
supabase/
├── migrations/                              # Database migration scripts
└── seed.sql                                 # Seed data
```

### **Configuration Files**
```
/Users/alaughingkitsune/src/Choices/
├── package.json
├── tsconfig.json
├── playwright.config.ts
└── next.config.js
```

---

## 🏆 **Proven Achievements (Current System Status)**

- ✅ **E2E Bypass Authentication** - Service role client pattern working across all APIs
  - **Location**: `web/lib/core/auth/service-role-client.ts`
  - **Tests**: `web/tests/e2e/api-endpoints.spec.ts`
- ✅ **Complete User Journeys** - Registration → onboarding → dashboard flow working
  - **Location**: `web/tests/e2e/user-journeys.spec.ts`
  - **Components**: `web/app/(app)/onboarding/page.tsx`, `web/components/onboarding/`
- ✅ **WebAuthn Implementation** - Complete with database migration, API routes, UI components
  - **Location**: `web/lib/webauthn/`, `web/app/api/webauthn/`
  - **Tests**: `web/tests/e2e/webauthn-flow.spec.ts`
- ✅ **Voting Architecture** - Two-step voting process (Start Voting → Voting Interface)
  - **Location**: `web/app/(app)/polls/[id]/vote/page.tsx`, `web/features/polls/`
  - **Tests**: `web/tests/e2e/poll-management.spec.ts`
- ✅ **Test ID Alignment** - All components properly aligned with T registry
  - **Location**: `web/lib/testing/testIds.ts`
  - **Usage**: All E2E tests use centralized test ID registry
- ✅ **Database Status** - 8 active tables with real data, 5 polls, 3 users, 2 votes
  - **Location**: `supabase/migrations/`, `supabase/seed.sql`
  - **Schema**: `docs/core/DATABASE_SCHEMA_COMPREHENSIVE.md`
- ✅ **E2E Test Coverage** - 4/4 core tests passing, systematic fixes applied
  - **Location**: `web/tests/e2e/` directory
  - **Config**: `web/playwright.config.ts`

---

## 📋 **Agent Update Requirements**

### **When Implementing Enhanced Components:**
1. **Update this file** with new component locations
2. **Update MASTER_IMPLEMENTATION_ROADMAP.md** with progress
3. **Update E2E tests** to reflect new functionality
4. **Archive obsolete components** after successful migration
5. **Update feature flags** as needed

### **File Status Legend:**
- ✅ **Active** - Currently in use
- 🔄 **In Progress** - Being implemented
- ⏳ **Pending** - Waiting for implementation
- 🗄️ **Archived** - Moved to archive after completion
- 🚫 **Disabled** - Feature disabled via feature flag

---

## 🧹 **Maintenance Notes**

- **Scratch Directory**: Clean regularly, use for temporary files only
- **Archive Directory**: Move completed/obsolete files here
- **Future Features**: Keep separate from current implementation
- **Core Docs**: Update when system architecture changes
- **Test Files**: Remove obsolete tests when components are replaced