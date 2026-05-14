/**
 * Detects corrupt Supabase auth-token cookies and reports the cookie names
 * that should be ignored (and ideally cleared) on the current request.
 *
 * Why this exists:
 *   @supabase/ssr stores the session JWT as a `base64-`-prefixed value that
 *   is split across one or more cookies (`sb-<ref>-auth-token`, `.0`, `.1`, …).
 *   When any chunk is truncated or rewritten by an intermediary, the combined
 *   payload can decode to a byte sequence that is not valid UTF-8. The library
 *   then throws `Error: Invalid UTF-8 sequence` on every server request that
 *   touches Supabase storage (i.e. every `.from(...)` / `.rpc(...)` call),
 *   surfacing to the user as opaque 500 responses on otherwise healthy
 *   anonymous-readable endpoints (e.g. `GET /api/polls`).
 *
 * Strategy:
 *   - Look at every cookie whose name matches `sb-*-auth-token` (with an
 *     optional `.N` chunk suffix).
 *   - Group chunks by base name, sort by index, join.
 *   - If the combined payload starts with `base64-`, base64url-decode and
 *     validate as strict UTF-8.
 *   - Cookies that fail validation are returned so callers can:
 *       1. exclude them from what they pass to `@supabase/ssr` (this request
 *          continues as anonymous instead of 500-ing); and
 *       2. send `Set-Cookie: name=; Max-Age=0` to clear them from the
 *          browser so future requests stop being broken.
 */

type CookieLike = { name: string; value: string };

const AUTH_TOKEN_RE = /^(sb-.+-auth-token)(?:\.(\d+))?$/;
const BASE64_PREFIX = 'base64-';

/**
 * Best-effort base64url -> UTF-8 strict validator. Mirrors the validation
 * @supabase/ssr performs internally; if this returns true, the cookie payload
 * will not trigger an `Invalid UTF-8 sequence` throw on the next read.
 */
export function isValidBase64UrlUtf8(payload: string): boolean {
  try {
    if (!payload) return false;
    let normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = normalized.length % 4;
    if (remainder) {
      normalized += '='.repeat(4 - remainder);
    }
    const bytes = Buffer.from(normalized, 'base64');
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the set of cookie names that contain undecodable Supabase auth-token
 * data. Pass any iterable of cookie name/value pairs (either Next.js's
 * `cookies()` store via `.getAll()`, or the parsed `Cookie` request header in
 * middleware).
 */
export function detectCorruptSupabaseAuthCookies(
  cookies: Iterable<CookieLike>,
): Set<string> {
  const groups = new Map<
    string,
    Array<{ name: string; index: number; value: string }>
  >();

  for (const cookie of cookies) {
    if (!cookie?.name) continue;
    const match = cookie.name.match(AUTH_TOKEN_RE);
    if (!match || !match[1]) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : -1;
    const list = groups.get(base) ?? [];
    list.push({ name: cookie.name, index, value: cookie.value ?? '' });
    groups.set(base, list);
  }

  const corrupt = new Set<string>();
  for (const parts of groups.values()) {
    parts.sort((a, b) => a.index - b.index);
    const combined = parts.map((p) => p.value).join('');
    if (!combined.startsWith(BASE64_PREFIX)) continue;
    const payload = combined.slice(BASE64_PREFIX.length);
    if (!isValidBase64UrlUtf8(payload)) {
      for (const p of parts) corrupt.add(p.name);
    }
  }
  return corrupt;
}
