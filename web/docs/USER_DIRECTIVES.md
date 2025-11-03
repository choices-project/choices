# User Directives - Project Tie-Off

**Date:** 2025-11-03  
**Status:** 🟢 ACTIVE

---

## 🎯 Core Directives

### 1. **Quality Over Speed**
> "We are here for the best application possible"

- ❌ No arbitrary time limits
- ❌ No corner-cutting
- ❌ No "good enough for now"
- ✅ Implement features thoroughly
- ✅ Research before coding
- ✅ Ask for clarification when needed

---

### 2. **Complete Features, Don't Remove Them**
> "Why is your phase 3 removing functions when I've already stated we are implementing functionality?"

- ✅ IMPLEMENT partial features
- ✅ Wire up unused functions if they're intended features
- ✅ Complete what was started
- ❌ Don't remove functionality to make lint pass
- ❌ Don't treat partial implementations as dead code

**Clarification:** Only remove code if it's truly dead/experimental, not if it's a feature waiting to be wired up.

---

### 3. **Full Functionality, Not Simple Versions**
> "SIMPLE is NOT MADE TO REPLACE COMPREHENSIVE we want full functionality"

- ✅ ComprehensiveAdminDashboard is PRIMARY
- ✅ Build complete features
- ✅ Don't simplify for performance at cost of features
- ❌ SimpleAdminDashboard approach is wrong
- ❌ Don't remove features for "lightweightness"

---

### 4. **Implement Properly With Research**
> "Ensure all implementation is integrated fully and perfectly. Comprehensively research the code."

- ✅ Research existing patterns FIRST
- ✅ Find existing APIs, stores, schemas
- ✅ Match established conventions
- ✅ Integrate with real infrastructure
- ❌ Don't create in isolation
- ❌ Don't guess at patterns

**Example Questions to Ask:**
- Should this use a Zustand store?
- What's the database schema?
- Are there existing APIs?
- How do similar features work?

---

### 5. **Fix Errors Properly, Not Silence Them**
> "We are not skipping corners? Implementing when we should and not just trying to silence the linter?"

- ✅ Fix root cause
- ✅ Understand context before changing
- ✅ Review `||` vs `??` logic carefully
- ✅ Implement features for unused variables
- ❌ No bulk find-replace
- ❌ No prefixing everything with `_`
- ❌ No `// eslint-disable` without justification

**Reference:** See LINT_FIX_STANDARDS.md

---

### 6. **No Terminal Hacks**
> "You are not to use sed commands"

- ❌ No sed
- ❌ No awk for editing
- ❌ No bash scripts for code changes
- ✅ Use proper file editing tools
- ✅ Make intentional, reviewable changes

---

## 📋 Approved Actions

### **UnifiedFeed Functions:**
- [x] User approved: **IMPLEMENT ALL 6 FUNCTIONS**
- Wire into UI properly
- No shortcuts

### **Consolidation Strategy:**
- [x] User approved: **AGGRESSIVE**
- Research all duplicates
- Consolidate everything
- Find canonical versions

### **Partial Features:**
- [x] User approved: **IMPLEMENT**
- No time limits
- Do it right
- Ask if unclear

---

## ✅ Implementation Standards

### Every change must:
1. ✅ Be researched first
2. ✅ Match existing patterns
3. ✅ Use real APIs/stores
4. ✅ Have proper error handling
5. ✅ Be production-ready
6. ✅ Be documented

### Before marking complete:
- [ ] Did I research existing infrastructure?
- [ ] Is this integrated properly?
- [ ] Does it match the codebase conventions?
- [ ] Would this pass senior engineer review?
- [ ] Is this the BEST implementation?

---

## 🚫 What NOT to Do

1. ❌ Remove features to reduce lint errors
2. ❌ Use simplified versions instead of comprehensive
3. ❌ Bulk replace without understanding context
4. ❌ Prefix variables without investigating if feature should be implemented
5. ❌ Skip research to save time
6. ❌ Create isolated code instead of integrating
7. ❌ Use arbitrary time limits to justify not implementing

---

## 💬 When to Ask for Clarification

**Always ask if:**
- Feature requires architectural decision
- Multiple valid approaches exist
- Impact is unclear
- Integration path is uncertain
- Would require significant new code

**Examples of good questions:**
- "Should this feature integrate with existing X or create new Y?"
- "I found duplicate implementations - which pattern should I follow?"
- "This partial feature would need A, B, C to complete - proceed?"

---

**Status:** ✅ ACTIVE DIRECTIVES  
**Last Updated:** 2025-11-03  
**Guiding Principle:** Best application possible, no shortcuts

