const AUTH_TOKEN_COOKIE_NAME = /^sb-.+-auth-token(?:\.\d+)?$/;

/** Chrome hint only — never use this as an API or RLS gate. */
export function hasAuthTokenCookies(cookies: Array<{ name: string }>): boolean {
  return cookies.some((cookie) => AUTH_TOKEN_COOKIE_NAME.test(cookie.name));
}
