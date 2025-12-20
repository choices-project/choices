# Dark Mode Implementation Guide

## Overview

This document explains how dark mode is implemented in the Choices application and why this approach is standard and correct.

## Standard Approach: Tailwind CSS Class-Based Dark Mode

### ✅ What We're Doing (Standard & Correct)

1. **Tailwind Configuration**: Using `darkMode: 'class'` in `tailwind.config.js`
   - This tells Tailwind to use the `.dark` class on the root element to toggle dark mode
   - This is the **standard approach** for applications that want user-controlled dark mode

2. **Theme Management**: Storing theme preference in Zustand store (`appStore`)
   - Supports three modes: `'light'`, `'dark'`, or `'system'`
   - `'system'` respects the user's OS preference
   - User preference is persisted to localStorage

3. **Applying Theme**: Adding/removing `.dark` class on `document.documentElement`
   ```typescript
   if (theme === 'dark') {
     document.documentElement.classList.add('dark');
   } else {
     document.documentElement.classList.remove('dark');
   }
   ```

4. **Component Styling**: Using Tailwind's `dark:` prefix for dark mode variants
   ```tsx
   <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
     Content
   </div>
   ```

### Why This Is Standard

1. **Industry Standard**: This is the exact approach recommended by:
   - [Tailwind CSS Official Docs](https://tailwindcss.com/docs/dark-mode)
   - Next.js documentation
   - Most modern React applications

2. **Flexibility**: Allows users to override system preference
   - Unlike `darkMode: 'media'` which only respects OS settings
   - Users can manually toggle dark/light mode

3. **Performance**: Class-based is more performant than JavaScript-based theme switching
   - CSS handles the styling, not JavaScript
   - No flash of wrong theme (FOUC) if done correctly

## Common Patterns

### ✅ Correct Pattern (What We Use)

```tsx
// Background colors
className="bg-white dark:bg-gray-900"

// Text colors
className="text-gray-900 dark:text-gray-100"

// Borders
className="border-gray-200 dark:border-gray-700"

// Combined example
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
  Content
</div>
```

### ❌ Anti-Patterns to Avoid

1. **Missing dark variants** (causes invisible text):
   ```tsx
   // ❌ BAD - text will be invisible in dark mode
   <p className="text-gray-900">Content</p>
   
   // ✅ GOOD - has dark mode variant
   <p className="text-gray-900 dark:text-gray-100">Content</p>
   ```

2. **Using only system preference** (no user control):
   ```js
   // ❌ BAD - users can't override
   darkMode: 'media'
   
   // ✅ GOOD - users can toggle
   darkMode: 'class'
   ```

3. **Hardcoded colors** (doesn't respect theme):
   ```tsx
   // ❌ BAD
   <div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
   
   // ✅ GOOD
   <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
   ```

## Color Palette Guidelines

### Light Mode → Dark Mode Mappings

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white` | `dark:bg-gray-900` | Main backgrounds |
| `bg-gray-50` | `dark:bg-gray-800` | Secondary backgrounds |
| `bg-gray-100` | `dark:bg-gray-700` | Tertiary backgrounds |
| `text-gray-900` | `dark:text-gray-100` | Primary text |
| `text-gray-700` | `dark:text-gray-300` | Secondary text |
| `text-gray-600` | `dark:text-gray-400` | Tertiary text |
| `text-gray-500` | `dark:text-gray-400` | Muted text |
| `border-gray-200` | `dark:border-gray-700` | Borders |

## Best Practices

1. **Always provide dark variants** for:
   - Text colors (`text-*`)
   - Background colors (`bg-*`)
   - Border colors (`border-*`)
   - Shadow colors (if custom)

2. **Test in both modes**:
   - Light mode: Ensure dark text on light backgrounds
   - Dark mode: Ensure light text on dark backgrounds

3. **Use semantic color tokens** when possible:
   - `text-foreground` / `bg-background` (from shadcn/ui)
   - These automatically adapt to theme

4. **Maintain contrast ratios**:
   - WCAG AA: 4.5:1 for normal text
   - WCAG AAA: 7:1 for normal text
   - Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Current Implementation Status

✅ **Correctly Implemented:**
- Tailwind config with `darkMode: 'class'`
- Theme store with light/dark/system modes
- Theme application to document root
- System theme detection and sync

⚠️ **Needs Work:**
- Many components missing dark mode variants (being fixed)
- Some components use hardcoded colors
- Navigation and feed components need dark mode classes

## Resources

- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [Next.js Theming Guide](https://nextjs.org/docs/app/building-your-application/styling/dark-mode)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

