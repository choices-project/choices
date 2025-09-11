# Security Policy

## Authentication Architecture

### Middleware = UX Only
- **Never implement authorization checks in middleware**
- Middleware is for redirects and performance only
- Real authorization happens server-side in route handlers

### Server-Side Authentication
- **All critical paths use route handlers with Supabase SSR**
- Use the `requireUser()` helper in all protected routes
- Set proper cache guards: `dynamic = 'force-dynamic'`, `revalidate = 0`
- Use `runtime = 'nodejs'` for handlers using pg, crypto, or service role

### Security Headers
- All responses with user data use `Cache-Control: no-store` and `Vary: Cookie`
- Origin validation on state-changing verbs (POST, PUT, PATCH, DELETE)
- Support for Vercel preview URLs and development environments

## Implementation Pattern

```typescript
// At top of route handlers using cookies/auth
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // For handlers using pg, crypto, or service role

export async function POST(req: Request) {
  try {
    requireTrustedOrigin(req); // CSRF protection
    const { user, fail } = await requireUser(req);
    if (!user) return fail();
    
    // ...authorized work...
    
    return NextResponse.json(data, {
      headers: { 
        'Cache-Control': 'no-store', 
        'Vary': 'Cookie' 
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

## Security Principles

1. **Never store JWTs client-side** - Use Supabase SSR cookies only
2. **Middleware for UX only** - All real authz in route handlers
3. **Server-side verification** - If you must verify JWTs, use `jose` with strict claims
4. **RLS everywhere** - Database is the final gate
5. **Origin validation** - Reject untrusted origins
6. **Rate limiting** - Add IP/user limits on sensitive endpoints
7. **Input validation** - Use Zod schemas for all user inputs

## Files

- `web/lib/auth.ts` - Server-side authentication helpers
- `web/lib/http.ts` - HTTP security helpers (origin validation, etc.)
- `web/app/api/protected-example/route.ts` - Example protected route template
