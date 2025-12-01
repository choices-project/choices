// This route previously duplicated the root `/` route and caused
// a Next.js standalone tracing error in Vercel by creating a
// phantom `app/(app)/page` entry without a corresponding
// client reference manifest. The actual landing behavior for `/`
// is defined in `app/page.tsx`, so this file is intentionally
// left empty to avoid conflicting root-level pages.

export {};
