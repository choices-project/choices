# Agent Onboarding Guide - Choices Project

**Created:** October 6, 2025  
**Status:** 🚀 **LIVING ONBOARDING DOCUMENT**  
**Purpose:** Complete onboarding guide for new agents joining the Choices project  
**Last Updated:** October 6, 2025

---

## 🎯 **WELCOME TO CHOICES**

Welcome to the Choices democratic platform! This guide will get you up to speed quickly and ensure you follow best practices for agent work on this project.

---

## 📋 **QUICK START CHECKLIST**

### **1. Environment Setup (5 minutes)**
- [ ] Read this entire onboarding guide
- [ ] Create your personal scratch directory: `scratch/agent-[your-name]/`
- [ ] Review the current project status
- [ ] Understand the CIVICS 2.0 system architecture

### **2. Documentation Review (15 minutes)**
- [ ] Read `scratch/CIVICS_2_SYSTEM_FILE_TREE.md` - Complete system overview
- [ ] Read `scratch/sensible_feed_implementation/CIVICS_2_0_SENSIBLE_BLUEPRINT.md` - Core vision
- [ ] Read `scratch/sensible_feed_implementation/SENSIBLE_ROADMAP.md` - Implementation plan
- [ ] Review `docs/core/DATABASE_SCHEMA_COMPREHENSIVE.md` - Database schema

### **3. Current Status Understanding (10 minutes)**
- [ ] Understand what's been completed (database, APIs, basic feed)
- [ ] Understand what's missing (mobile-first cards, touch interactions)
- [ ] Understand what's partial (social feed enhancement)
- [ ] Review archived implementations to avoid duplication

---

## 🏗️ **PROJECT ARCHITECTURE OVERVIEW**

### **Core Mission: The Essential Three**
1. **Rich Civics Data** - 200+ data points per representative ✅ **ACHIEVED**
2. **Beautiful Candidate Cards** - Visual, engaging, informative ❌ **MISSING - PRIORITY 1**
3. **Social User Feed** - Instagram-like civic content feed ⚠️ **PARTIAL - PRIORITY 2**

### **Current System Status**
- **Database Schema:** ✅ **COMPREHENSIVE** - All tables created and optimized
- **API Pipeline:** ✅ **WORKING** - 4 out of 5 APIs functional with rich data
- **Data Ingestion:** ✅ **PRODUCTION READY** - Comprehensive data collection
- **Basic Feed:** ⚠️ **PARTIAL** - Structure exists, needs enhancement
- **Mobile-First Cards:** ❌ **MISSING** - Critical gap to address

---

## 📁 **AGENT WORKFLOW & BEST PRACTICES**

### **1. Create Your Personal Directory**
```bash
# Always create your own scratch directory
mkdir -p scratch/agent-[your-name]/
cd scratch/agent-[your-name]/
```

**Why:** Keeps your work organized and prevents conflicts with other agents.

### **2. File Organization**
```
scratch/agent-[your-name]/
├── README.md                    # Your work summary
├── implementation/              # Implementation files
├── research/                    # Research documents
├── temp/                       # Temporary files
└── notes/                      # Your notes and planning
```

### **3. Documentation Standards**
- **Always update relevant documentation** when making changes
- **Use clear, descriptive commit messages** with file paths
- **Reference specific files** in your work descriptions
- **Update roadmaps** with progress and next steps

---

## 🎯 **CURRENT IMPLEMENTATION PRIORITIES**

### **PRIORITY 1: Mobile-First Candidate Cards** 🎯 **CRITICAL**

#### **Files to Create:**
```
web/components/civics-2-0/
├── CandidateCard.tsx              # Main candidate card component
├── MobileCandidateCard.tsx        # Mobile-optimized version
├── ProgressiveDisclosure.tsx      # Progressive disclosure system
└── TouchInteractions.tsx         # Touch gesture handling
```

#### **Implementation Requirements:**
- **Mobile-first responsive design**
- **Touch interactions** (swipe, tap, long-press)
- **Progressive disclosure** (essential info first, details on demand)
- **Photo management** (primary + secondary photos)
- **Social media integration**
- **Accessibility** (WCAG 2.2 AA compliance)

#### **Dependencies:**
- `web/lib/civics-2-0/free-apis-pipeline.ts` - Data source
- `web/app/api/civics/representative/[id]/route.ts` - API endpoint
- `web/app/(app)/civics-2-0/page.tsx` - Integration point

### **PRIORITY 2: Enhanced Social Feed** ⚠️ **IMPORTANT**

#### **Files to Enhance:**
```
web/components/civics-2-0/
├── SocialFeed.tsx                 # Enhance existing component
├── FeedItem.tsx                  # Create new component
└── InfiniteScroll.tsx            # Create new component
```

#### **Enhancement Requirements:**
- **Instagram-like infinite scroll**
- **Pull-to-refresh functionality**
- **Real-time updates**
- **Personalization algorithms**
- **Engagement metrics**
- **Touch gesture support**

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **1. Before Starting Work**
```bash
# 1. Check current status
cd /Users/alaughingkitsune/src/Choices
git status

# 2. Create your scratch directory
mkdir -p scratch/agent-[your-name]/

# 3. Review the file tree
cat scratch/CIVICS_2_SYSTEM_FILE_TREE.md

# 4. Check current implementation status
cat scratch/sensible_feed_implementation/SENSIBLE_ROADMAP.md
```

### **2. During Development**
```bash
# 1. Work in your scratch directory
cd scratch/agent-[your-name]/

# 2. Create implementation files
touch implementation/CandidateCard.tsx
touch implementation/MobileCandidateCard.tsx

# 3. Test your implementation
npm run types:dev
npm run lint
npm run test

# 4. Update documentation
echo "## Progress Update" >> README.md
echo "- Created CandidateCard.tsx" >> README.md
```

### **3. After Completing Work**
```bash
# 1. Update relevant documentation
# 2. Update roadmap with progress
# 3. Commit with clear messages
# 4. Update this onboarding guide if needed
```

---

## 📚 **ESSENTIAL DOCUMENTATION**

### **Core System Documentation**
- `scratch/CIVICS_2_SYSTEM_FILE_TREE.md` - **CRITICAL** - Complete system overview
- `scratch/sensible_feed_implementation/CIVICS_2_0_SENSIBLE_BLUEPRINT.md` - Core vision
- `scratch/sensible_feed_implementation/SENSIBLE_ROADMAP.md` - Implementation plan

### **Database & API Documentation**
- `docs/core/DATABASE_SCHEMA_COMPREHENSIVE.md` - Database schema
- `docs/AUDITED_CURRENT_IMPLEMENTATION/CIVICS_SYSTEM_COMPLETE_IMPLEMENTATION.md` - System audit

### **Implementation Guides**
- `docs/implementation/features/CIVICS_CAMPAIGN_FINANCE.md` - Campaign finance
- `docs/implementation/features/CIVICS_ADDRESS_LOOKUP.md` - Address lookup
- `docs/implementation/features/CIVICS_VOTING_RECORDS.md` - Voting records

### **Archived Implementations (Reference Only)**
- `archive/agent-e-implementations/` - Agent E's work (archived)
- `archive/inferior-components/` - Inferior components (archived)

---

## 🚫 **CRITICAL DON'TS**

### **1. File Management**
- ❌ **DON'T** work directly in the main codebase without understanding dependencies
- ❌ **DON'T** create files in the root directory
- ❌ **DON'T** modify core pipeline files without understanding the impact
- ❌ **DON'T** delete or move files without checking dependencies

### **2. Documentation**
- ❌ **DON'T** make changes without updating relevant documentation
- ❌ **DON'T** create duplicate documentation
- ❌ **DON'T** ignore the file tree and dependency map
- ❌ **DON'T** work on archived implementations

### **3. Implementation**
- ❌ **DON'T** start implementing without reading the current status
- ❌ **DON'T** ignore mobile-first design requirements
- ❌ **DON'T** skip accessibility considerations
- ❌ **DON'T** create components without understanding the data flow

---

## ✅ **CRITICAL DO'S**

### **1. File Management**
- ✅ **DO** create your own scratch directory
- ✅ **DO** reference the file tree for dependencies
- ✅ **DO** understand the data flow before implementing
- ✅ **DO** test your changes thoroughly

### **2. Documentation**
- ✅ **DO** update relevant documentation with your changes
- ✅ **DO** reference specific file paths in your work
- ✅ **DO** update roadmaps with progress
- ✅ **DO** follow the established documentation patterns

### **3. Implementation**
- ✅ **DO** start with Priority 1 (Mobile-First Candidate Cards)
- ✅ **DO** follow mobile-first design principles
- ✅ **DO** implement touch interactions
- ✅ **DO** ensure accessibility compliance

---

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- **Mobile-first design** - Touch-optimized interactions
- **Accessibility** - WCAG 2.2 AA compliance
- **Performance** - <100ms for representative lookups
- **Data completeness** - 90%+ fields populated per representative

### **User Experience Metrics**
- **Mobile usage** - 70%+ of users on mobile
- **Engagement** - 60%+ of users interact with rich data
- **Feed engagement** - 50%+ of users engage with feed content
- **User satisfaction** - 85%+ user satisfaction rate

---

## 🚀 **GETTING STARTED**

### **Step 1: Read the Documentation (30 minutes)**
1. Read `scratch/CIVICS_2_SYSTEM_FILE_TREE.md` - Complete system overview
2. Read `scratch/sensible_feed_implementation/CIVICS_2_0_SENSIBLE_BLUEPRINT.md` - Core vision
3. Read `scratch/sensible_feed_implementation/SENSIBLE_ROADMAP.md` - Implementation plan

### **Step 2: Create Your Workspace (5 minutes)**
```bash
mkdir -p scratch/agent-[your-name]/
cd scratch/agent-[your-name]/
touch README.md
echo "# Agent [Your Name] Work Summary" > README.md
```

### **Step 3: Start with Priority 1 (Mobile-First Candidate Cards)**
1. Create `web/components/civics-2-0/CandidateCard.tsx`
2. Implement mobile-first design
3. Add touch interactions
4. Test thoroughly
5. Update documentation

### **Step 4: Follow the Workflow**
1. Work in your scratch directory
2. Test your implementation
3. Update relevant documentation
4. Commit with clear messages
5. Update roadmaps with progress

---

## 📞 **SUPPORT & RESOURCES**

### **Key Files to Reference**
- `scratch/CIVICS_2_SYSTEM_FILE_TREE.md` - Complete system overview
- `scratch/sensible_feed_implementation/SENSIBLE_ROADMAP.md` - Implementation plan
- `docs/core/DATABASE_SCHEMA_COMPREHENSIVE.md` - Database schema

### **Current Status**
- **Foundation:** ✅ **COMPLETE** - Database, APIs, data pipeline
- **Mobile Cards:** ❌ **MISSING** - Priority 1 implementation
- **Social Feed:** ⚠️ **PARTIAL** - Priority 2 enhancement

### **Next Steps**
1. **Create Mobile-First CandidateCard Component** - Visual, engaging, touch-optimized
2. **Enhance SocialFeed Component** - Instagram-like experience with personalization
3. **Implement Touch Interactions** - Swipe, tap, long-press gestures
4. **Add Progressive Disclosure** - Essential information first, details on demand

---

## 🎉 **WELCOME TO THE TEAM!**

You're now ready to contribute to the Choices democratic platform. Remember:

- **Work in your scratch directory**
- **Follow the file tree and dependencies**
- **Update documentation with your changes**
- **Start with Priority 1 (Mobile-First Candidate Cards)**
- **Test thoroughly and ensure accessibility**

**The foundation is solid, the plan is clear, and we're ready to build something incredible!** 🚀

---

**This onboarding guide ensures all agents can quickly understand the project, follow best practices, and contribute effectively to the Choices democratic platform.** 🎯
