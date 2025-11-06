# Privacy E2E Tests

Comprehensive end-to-end tests for the privacy system.

**Created:** November 5, 2025  
**Status:** ✅ COMPLETE

---

## Test Files

### 1. `privacy-onboarding.spec.ts`
Tests the privacy onboarding flow with all 16 privacy controls.

**Covers:**
- All 16 privacy controls displayed with default OFF state
- Individual control toggling
- Maximum Privacy preset (all OFF)
- Recommended preset
- Skip option (maximum privacy)
- Settings persistence after onboarding
- Clear explanations and impact statements

### 2. `data-export.spec.ts`
Tests GDPR/CCPA compliant data export functionality.

**Covers:**
- Export all user data in JSON format
- Export includes only opted-in data
- Summary statistics in export
- Export works with no optional data
- Error handling for unauthenticated requests

### 3. `data-deletion.spec.ts`
Tests granular and complete data deletion.

**Covers:**
- Delete individual categories (location, voting, interests, feed-interactions, analytics, representatives, search)
- Confirmation dialogs required
- Cancel deletion option
- Complete account deletion with double confirmation
- API-level deletion tests
- Authentication requirements

### 4. `privacy-settings-persistence.spec.ts`
Tests privacy settings updates and persistence.

**Covers:**
- Settings persist after page reload
- Auto-save after 1 second
- Multiple settings update independently
- Quick presets (maximum privacy, recommended)
- Privacy status displayed in dashboard
- Privacy settings respected across app
- API-level settings updates

---

## Running Tests

### All Privacy Tests
```bash
cd /Users/alaughingkitsune/src/Choices/web
npx playwright test tests/e2e/privacy/
```

### Specific Test File
```bash
npx playwright test tests/e2e/privacy/privacy-onboarding.spec.ts
```

### With UI Mode (Interactive)
```bash
npx playwright test --ui tests/e2e/privacy/
```

### Debug Mode
```bash
npx playwright test tests/e2e/privacy/ --debug
```

---

## Test Coverage

### Privacy Controls Tested
All 16 controls:
- ✅ Data Collection (6 controls)
- ✅ Visibility (4 controls)
- ✅ Personalization (2 controls)
- ✅ Trust & Biometric (1 control)
- ✅ Data Retention (3 controls)

### User Flows Tested
- ✅ Privacy onboarding (new users)
- ✅ Privacy settings updates (existing users)
- ✅ Data export (GDPR/CCPA compliance)
- ✅ Granular data deletion (7 categories)
- ✅ Complete account deletion
- ✅ Settings persistence
- ✅ Cross-app privacy enforcement

### API Endpoints Tested
- ✅ `POST /api/profile/export` - Data export
- ✅ `DELETE /api/profile/data?type=<type>` - Category deletion
- ✅ `DELETE /api/profile/delete` - Account deletion
- ✅ `PUT /api/user/preferences` - Settings update

---

## Prerequisites

### Test Data Setup
Tests assume:
- User can register/login
- Privacy settings default to FALSE
- API endpoints are functional
- Database is accessible

### Environment
- Playwright installed
- Development server running on port 3000
- Database seeded with test data (if applicable)

### Test IDs Required
The tests use `data-testid` attributes. Ensure components have:
- `data-testid="privacy-step"` - Privacy onboarding step
- `data-testid="privacy-{controlName}"` - Individual privacy toggles
- `data-testid="my-data-tab"` - My Data dashboard tab
- `data-testid="export-data-button"` - Export button
- `data-testid="delete-category-{category}"` - Delete category buttons
- `data-testid="delete-account-button"` - Account deletion button
- `data-testid="confirm-delete-button"` - Confirmation button
- `data-testid="privacy-setting-{controlName}"` - Settings page toggles

---

## Expected Results

All tests should pass, verifying:
- Privacy-first defaults (all OFF)
- User control (can enable/disable any control)
- Data export works (GDPR/CCPA compliant)
- Data deletion works (granular and complete)
- Settings persist correctly
- Privacy enforced across application

---

## Maintenance

### When to Update Tests
- Adding new privacy controls
- Changing privacy UI
- Modifying API endpoints
- Updating deletion logic

### Test Maintenance
- Keep test IDs synchronized with components
- Update selectors if UI changes
- Verify API responses match current implementation
- Check for new privacy features to test

---

**Created:** November 5, 2025  
**Test Framework:** Playwright  
**Coverage:** Comprehensive privacy system  
**Status:** ✅ Ready for execution


