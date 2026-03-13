# Component Library

_Last updated: March 2026_

Reusable UI components and their usage patterns. Prefer these over custom implementations for consistency and accessibility.

## Shared Components

### EnhancedEmptyState

No-data state with clear guidance and CTAs.

**Props:** `title`, `description`, `tip?`, `primaryAction?`, `secondaryAction?`, `isFiltered?`, `onResetFilters?`, `icon?`

**Usage:**
```tsx
<EnhancedEmptyState
  title="No polls yet"
  description="Create your first poll to get started."
  primaryAction={{ label: 'Create Poll', href: '/polls/create' }}
  secondaryAction={{ label: 'Browse Templates', href: '/polls/templates' }}
/>
```

### EnhancedErrorDisplay

Error state with recovery options and retry.

**Props:** `title?`, `message`, `details?`, `tip?`, `primaryAction?`, `secondaryAction?`, `canRetry?`, `onRetry?`, `severity?`

**Usage:**
```tsx
<EnhancedErrorDisplay
  title="Failed to load"
  message={error}
  canRetry
  onRetry={refetch}
  secondaryAction={{ label: 'Go back', onClick: () => router.back() }}
/>
```

### AnimatedCard

Framer Motion wrapper for staggered card entrance animations. Respects `prefers-reduced-motion`.

**Props:** `children`, `delay?`, `className?`

**Usage:**
```tsx
<AnimatedCard delay={0.1}>
  <Card>...</Card>
</AnimatedCard>
```

### AnimatedVoteBar

Animated vote result bar that fills to a percentage with spring animation.

**Props:** `percentage`, `color?`, `label?`, `animated?`

### PageTransition

Route-level fade/slide transition wrapper using Framer Motion's `AnimatePresence`.

### BottomSheet

Mobile bottom sheet with swipe-to-dismiss gesture support.

**Props:** `isOpen`, `onClose`, `children`, `title?`

### VoteSubmitButton

Shared submit button for all voting components with loading state, spinner, and configurable variants.

**Props:** `isSubmitting`, `disabled`, `onClick`, `icon?`, `label?`, `submittingLabel?`, `variant?` (`primary` | `green` | `pink` | `yellow`)

### SkipNavLink / SkipNavTarget

Accessibility: skip-to-main for keyboard users.

**Usage:**
```tsx
<SkipNavLink href="#main-content" label="Skip to main content" />
// ...
<SkipNavTarget id="main-content">{children}</SkipNavTarget>
```

## UI Primitives (shadcn)

- **Button** — `variant`, `size`, `asChild` for Link
- **Card** — CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Input**, **Textarea**, **Select** — Form controls
- **Alert** — AlertTitle, AlertDescription
- **Badge** — Status indicators
- **Skeleton** — Loading placeholders

## Patterns

| Need | Use |
|------|-----|
| Loading | Skeleton + `role="status"` `aria-busy="true"` |
| Error | EnhancedErrorDisplay |
| Empty | EnhancedEmptyState |
| Modal | useAccessibleDialog (focus trap, Escape) |
| Form errors | `aria-invalid`, `aria-describedby`, `role="alert"` on message |
| Animations | AnimatedCard + `prefers-reduced-motion` |
| Toast notifications | `useNotificationStore` → `addNotification()` |
| Confirm dialogs | shadcn AlertDialog (not `window.confirm`) |
| Mobile modals | BottomSheet on mobile, Dialog on desktop |
| Vote submit | VoteSubmitButton with Loader2 spinner |
| Live announcements | `useLiveAnnouncer` for screen readers |
