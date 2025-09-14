# File Structure Reorganization Plan

**Created:** December 19, 2024  
**Goal:** Organize sprawling file tree for better visual and structural sense

## 🎯 Current Issues

1. **WebAuthn deeply integrated** - 54 files with WebAuthn references
2. **Mixed feature organization** - Core features mixed with experimental ones
3. **Archive/disabled files scattered** - Hard to understand what's active
4. **Unclear separation** - No clear distinction between core vs future features

## 🏗️ Proposed New Structure

```
web/
├── core/                          # Core, stable features
│   ├── auth/                      # Basic auth (email/password)
│   ├── polls/                     # Polling system
│   ├── users/                     # User management
│   └── api/                       # Core API routes
├── features/                      # Experimental/future features
│   ├── webauthn/                  # WebAuthn (disabled for now)
│   ├── pwa/                       # PWA features
│   ├── analytics/                 # Analytics system
│   └── admin/                     # Admin features
├── shared/                        # Shared utilities
│   ├── lib/                       # Core utilities
│   ├── components/                # Reusable components
│   └── types/                     # Type definitions
├── archive/                       # Historical/obsolete code
└── disabled/                      # Temporarily disabled features
```

## 🔄 Migration Strategy

### Phase 1: Create New Structure
1. Create new directories
2. Move core features to `core/`
3. Move experimental features to `features/`

### Phase 2: Disable WebAuthn Gracefully
1. Move WebAuthn files to `features/webauthn/`
2. Add feature flags to disable WebAuthn
3. Update imports and references

### Phase 3: Clean Up
1. Remove unused files
2. Update documentation
3. Verify build works

## 📁 Detailed File Moves

### Core Features (Move to `core/`)
```
web/app/api/polls/ → web/core/api/polls/
web/app/api/user/ → web/core/api/user/
web/app/login/ → web/core/auth/login/
web/app/register/ → web/core/auth/register/
web/lib/supabase/ → web/shared/lib/supabase/
web/lib/ssr-safe.ts → web/shared/lib/ssr-safe.ts
```

### Future Features (Move to `features/`)
```
web/lib/webauthn.ts → web/features/webauthn/lib/webauthn.ts
web/app/api/auth/webauthn/ → web/features/webauthn/api/
web/components/auth/Biometric* → web/features/webauthn/components/
web/lib/pwa-* → web/features/pwa/lib/
web/lib/analytics* → web/features/analytics/lib/
```

### Archive (Move to `archive/`)
```
web/archive/ → web/archive/ (already exists)
web/disabled-* → web/disabled/
web/*.disabled → web/disabled/
```

## 🚀 Benefits

1. **Clear separation** - Core vs experimental features
2. **Easier maintenance** - Related files grouped together
3. **Better onboarding** - New developers can focus on core first
4. **Feature flags** - Easy to enable/disable features
5. **Cleaner imports** - More intuitive import paths

## ⚠️ Considerations

1. **Import updates** - All imports will need updating
2. **Build configuration** - May need path updates
3. **Testing** - Ensure all tests still work
4. **Documentation** - Update all references

## 🎯 Success Criteria

- [ ] Core features work perfectly
- [ ] WebAuthn gracefully disabled
- [ ] Clear file organization
- [ ] All imports updated
- [ ] Build passes
- [ ] Documentation updated
