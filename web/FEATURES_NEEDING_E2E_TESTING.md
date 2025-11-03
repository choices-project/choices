# Features Needing E2E Testing

**Created:** 2025-01-23  
**Updated:** 2025-01-30  
**Status:** ✅ **RECONCILED** - All enabled features now have E2E test coverage  
**Purpose:** Track enabled features and their E2E test coverage status

---

## 🎯 **Executive Summary**

All **enabled features** now have **comprehensive E2E test coverage**. This document reflects the reconciled state after verification against the actual codebase.

---

## 📊 **Feature Status Overview**

### ✅ **CORE MVP FEATURES (Always Enabled)**
| Feature | Status | E2E Tests | Test File | Priority |
|---------|--------|-----------|-----------|----------|
| **WEBAUTHN** | ✅ Enabled | ✅ Comprehensive | `authentication-*.spec.ts` | ✅ Complete |
| **PWA** | ✅ Enabled | ✅ Comprehensive | `pwa-*.spec.ts` | ✅ Complete |
| **ADMIN** | ✅ Enabled | ✅ Comprehensive | Various admin tests | ✅ Complete |
| **FEEDBACK_WIDGET** | ✅ Enabled | ✅ **STANDALONE** | `feedback-widget.spec.ts` | ✅ Complete |

### ✅ **ENHANCED MVP FEATURES (Ready for Implementation)**
| Feature | Status | E2E Tests | Test File | Priority |
|---------|--------|-----------|-----------|----------|
| **ENHANCED_ONBOARDING** | ✅ Enabled | ✅ Comprehensive | `user-journeys.spec.ts`, `civics-complete-user-journey.spec.ts` | ✅ Complete |
| **ENHANCED_PROFILE** | ✅ Enabled | ✅ Comprehensive | `user-journeys.spec.ts` | ✅ Complete |
| **ENHANCED_DASHBOARD** | ✅ Enabled | ✅ Comprehensive | `user-journeys.spec.ts` | ✅ Complete |
| **ENHANCED_POLLS** | ✅ Enabled | ✅ Comprehensive | `poll-management.spec.ts`, `user-journeys.spec.ts` | ✅ Complete |
| **ENHANCED_VOTING** | ✅ Enabled | ✅ Comprehensive | `poll-management.spec.ts` | ✅ Complete |
| **CIVICS_ADDRESS_LOOKUP** | ✅ Enabled | ✅ Comprehensive | `civics-address-lookup.spec.ts`, `civics-complete-user-journey.spec.ts` | ✅ Complete |

### ✅ **CIVICS & ACCOUNTABILITY FEATURES** (Real Data Available)
| Feature | Status | E2E Tests | Test File | Priority |
|---------|--------|-----------|-----------|----------|
| **CIVICS_REPRESENTATIVE_DATABASE** | ✅ Enabled (1,273 reps) | ✅ Comprehensive | `civics-representative-db.spec.ts`, `civics-complete-user-journey.spec.ts` | ✅ Complete |
| **CIVICS_CAMPAIGN_FINANCE** | ✅ Enabled (92 FEC records) | ✅ Comprehensive | `civics-campaign-finance.spec.ts` | ✅ Complete |
| **CIVICS_VOTING_RECORDS** | ✅ Enabled (2,185 records) | ✅ Comprehensive | `civics-voting-records.spec.ts` | ✅ Complete |
| **CANDIDATE_ACCOUNTABILITY** | ✅ Enabled | ✅ Comprehensive | `civics-campaign-finance.spec.ts`, `civics-voting-records.spec.ts` | ✅ Complete |
| **CANDIDATE_CARDS** | ✅ Enabled | ✅ **COVERED** | `civics-campaign-finance.spec.ts`, `civics-voting-records.spec.ts` | ✅ Complete |
| **ALTERNATIVE_CANDIDATES** | ✅ Enabled | ✅ **STANDALONE** | `candidate-accountability-alternatives.spec.ts` | ✅ Complete |

### ✅ **PERFORMANCE & OPTIMIZATION**
| Feature | Status | E2E Tests | Test File | Priority |
|---------|--------|-----------|-----------|----------|
| **FEATURE_DB_OPTIMIZATION_SUITE** | ✅ Enabled | ✅ Comprehensive | `db-optimization.spec.ts` | ✅ Complete |
| **ANALYTICS** | ✅ Enabled | ✅ Comprehensive | `analytics.spec.ts` | ✅ Complete |

---

## ✅ **ALL FEATURES COVERED**

All enabled features now have corresponding E2E tests. Test files are organized by feature area and follow Playwright best practices.

---

## 📋 **E2E Test File Reference**

### **Test Structure**
```
tests/e2e/
├── feedback-widget.spec.ts                        # FEEDBACK_WIDGET (STANDALONE)
├── candidate-accountability-alternatives.spec.ts  # ALTERNATIVE_CANDIDATES
├── civics-representative-db.spec.ts               # CIVICS_REPRESENTATIVE_DATABASE
├── civics-campaign-finance.spec.ts                # CIVICS_CAMPAIGN_FINANCE
├── civics-voting-records.spec.ts                  # CIVICS_VOTING_RECORDS
├── civics-complete-user-journey.spec.ts           # Comprehensive civics flow
├── civics-address-lookup.spec.ts                  # CIVICS_ADDRESS_LOOKUP
├── civics-fullflow.spec.ts                        # Complete civics workflows
├── civics-endpoints-comprehensive.spec.ts         # Civics API endpoints
├── db-optimization.spec.ts                        # FEATURE_DB_OPTIMIZATION_SUITE
├── analytics.spec.ts                              # ANALYTICS
├── user-journeys.spec.ts                          # User lifecycle (includes feedback widget flows)
├── poll-management.spec.ts                        # ENHANCED_POLLS, ENHANCED_VOTING
├── authentication-*.spec.ts                       # WEBAUTHN, ENHANCED_AUTH
├── pwa-*.spec.ts                                  # PWA features
└── rate-limit-*.spec.ts                           # Rate limiting
```

### **Test Coverage Details**

#### **FEEDBACK_WIDGET** ✅
- **File:** `feedback-widget.spec.ts`
- **Coverage:** 
  - Widget rendering and interaction
  - Multi-step form submission (Bug Report, Feature Request, General Feedback)
  - Sentiment selection
  - Offline/retry behavior
  - User journey tracking
- **Also tested in:** `user-journeys.spec.ts` (comprehensive user lifecycle)

#### **ALTERNATIVE_CANDIDATES** ✅
- **File:** `candidate-accountability-alternatives.spec.ts`
- **Coverage:**
  - Alternative candidates section visibility
  - Show/Hide toggle functionality
  - Candidate information display
  - Platform, funding, endorsements
  - Visibility level badges
- **Also tested in:** Component is part of `CandidateAccountabilityCard` tested in other specs

#### **CANDIDATE_CARDS** ✅
- **Coverage:** Representative cards displayed on `/civics` page
- **Tested in:** `civics-campaign-finance.spec.ts`, `civics-voting-records.spec.ts`
- **Note:** Cards are tested as part of the civics page flow, not as a standalone component

---

## 🎯 **Success Criteria**

### **MVP Readiness Checklist** ✅
- [x] All critical features have comprehensive E2E tests
- [x] Test files organized by feature area
- [x] Tests follow Playwright best practices
- [x] External API mocking in place
- [x] Error handling and edge cases covered

### **Quality Gates**
- **Test Coverage:** ✅ 100% of enabled features
- **Test Organization:** ✅ Clear file structure
- **Test Patterns:** ✅ Consistent across files
- **Documentation:** ✅ Up-to-date status

---

## 📝 **Next Steps**

1. ✅ **Completed:** All enabled features have E2E tests
2. **Ongoing:** Monitor test reliability and update as features evolve
3. **Future:** Add performance benchmarks and load testing
4. **Continuous:** Maintain test coverage as new features are added

---

## 🔗 **Related Documentation**

- [Feature Flags Documentation](../docs/implementation/FEATURE_FLAGS_DOCUMENTATION.md)
- [E2E Test Strategy](../docs/implementation/FOCUSED_TEST_STRATEGY.md)
- [Project Status Summary](../docs/implementation/PROJECT_STATUS_SUMMARY.md)
- [Comprehensive Feature Documentation](../docs/implementation/COMPREHENSIVE_FEATURE_DOCUMENTATION.md)

---

## 📝 **Notes**

### **Feature Reconciliation (2025-01-30)**
- **CANDIDATE_CARDS:** This feature flag exists but the actual implementation refers to the representative display cards on the `/civics` page, which are tested as part of the civics test suite. The `RepresentativeCard` component exists but is not actively used in the civics page (it uses inline Card components instead).

- **ALTERNATIVE_CANDIDATES:** Implemented as part of `CandidateAccountabilityCard` component, now has dedicated test file.

- **FEEDBACK_WIDGET:** Previously only tested within `user-journeys.spec.ts`, now has standalone test file for focused testing.

---

**Last Updated:** 2025-01-30  
**Next Review:** 2025-02-06

