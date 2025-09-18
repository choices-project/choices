# Poll System Consolidation Plan

## Immediate Actions (Fix Current Error)

### 1. Fix Current Poll Page (URGENT)
**Problem**: `/app/(app)/polls/[id]/page.tsx` has server/client component mixing causing `net::ERR_ABORTED`

**Solution**: 
- Fix server/client component boundaries
- Add proper error boundaries
- Use existing components from features

### 2. Create Proper Individual Poll Page
**Missing**: `/features/polls/pages/[id]/page.tsx`

**Solution**:
- Create server component that fetches poll data
- Create client component that uses existing features
- Update app route to re-export from features

## Component Consolidation Strategy

### Phase 1: Remove Clear Duplicates
1. **DELETE**: `/components/polls/CreatePollForm.tsx` (basic duplicate)
2. **DELETE**: `/components/CreatePoll.tsx` (another duplicate)
3. **KEEP**: `/features/polls/components/CreatePollForm.tsx` (most advanced)

### Phase 2: Evaluate Complex Components
1. **EVALUATE**: `/components/polls/PollCreationSystem.tsx`
   - Has unique features (tabs, suggestions, my-polls)
   - May need to be moved to features or integrated
   
2. **EVALUATE**: `/components/polls/CommunityPollSelection.tsx`
   - Has unique community features
   - May need to be moved to features or integrated

### Phase 3: Create Missing Components
1. **CREATE**: `/features/polls/pages/[id]/page.tsx` (individual poll page)
2. **CREATE**: `/features/polls/components/IndividualPollPage.tsx` (client component)
3. **INTEGRATE**: Use existing PollResults components

## File Structure After Consolidation

```
web/
├── app/(app)/polls/
│   ├── page.tsx                    # Re-exports from features
│   ├── create/page.tsx             # Re-exports from features
│   └── [id]/page.tsx               # Re-exports from features
├── features/polls/
│   ├── pages/
│   │   ├── page.tsx                # Poll listing (EXISTS)
│   │   ├── create/page.tsx         # Poll creation (EXISTS)
│   │   └── [id]/page.tsx           # Individual poll (CREATE)
│   ├── components/
│   │   ├── CreatePollForm.tsx      # Advanced form (KEEP)
│   │   ├── IndividualPollPage.tsx  # Individual poll (CREATE)
│   │   ├── PollResults.tsx         # Results display (EXISTS)
│   │   └── EnhancedVoteForm.tsx    # Voting form (EXISTS)
│   └── lib/                        # Services (CREATE)
└── components/polls/                # REMOVE (duplicates)
```

## Implementation Steps

### Step 1: Fix Current Error (IMMEDIATE)
```bash
# Fix server/client component mixing in current poll page
# Add error boundaries
# Test E2E approval voting
```

### Step 2: Create Proper Architecture
```bash
# Create /features/polls/pages/[id]/page.tsx
# Create /features/polls/components/IndividualPollPage.tsx
# Update /app/(app)/polls/[id]/page.tsx to re-export
```

### Step 3: Remove Duplicates
```bash
# Delete /components/polls/CreatePollForm.tsx
# Delete /components/CreatePoll.tsx
# Evaluate /components/polls/PollCreationSystem.tsx
# Evaluate /components/polls/CommunityPollSelection.tsx
```

### Step 4: Test Everything
```bash
# Run E2E tests
# Verify all functionality works
# Check for any broken imports
```

## Risk Mitigation

### High Risk
- **Current poll page is ONLY implementation** - backup before changes
- **E2E tests depend on current structure** - maintain compatibility

### Medium Risk
- **Component dependencies** - check all imports
- **Type conflicts** - consolidate types

### Low Risk
- **Feature architecture** - well-established pattern
- **Existing components** - already tested

## Success Criteria

1. ✅ E2E approval voting test passes
2. ✅ Individual poll page follows feature architecture
3. ✅ No duplicate components
4. ✅ All existing functionality preserved
5. ✅ Proper server/client component boundaries
6. ✅ Consistent type system
