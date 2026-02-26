# Component Library

_Last updated: February 2026_

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
