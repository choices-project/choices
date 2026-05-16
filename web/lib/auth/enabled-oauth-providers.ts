const ALL_OAUTH_PROVIDERS = [
  'google',
  'github',
  'apple',
  'facebook',
  'twitter',
  'linkedin',
  'discord',
  'instagram',
  'tiktok',
] as const;

export type OAuthProviderId = (typeof ALL_OAUTH_PROVIDERS)[number];

/** Providers enabled via NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS (comma-separated). */
export function getEnabledOAuthProviderIds(): OAuthProviderId[] {
  const envValue = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS;
  const enabled =
    envValue && envValue.trim()
      ? envValue.split(',').map((p) => p.trim()).filter(Boolean)
      : ['google', 'github'];
  return ALL_OAUTH_PROVIDERS.filter((p) => enabled.includes(p));
}

export function isEnabledOAuthProvider(value: string): value is OAuthProviderId {
  return getEnabledOAuthProviderIds().includes(value as OAuthProviderId);
}
