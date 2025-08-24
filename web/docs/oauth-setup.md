# OAuth Provider Setup Guide

This document outlines how to configure additional OAuth providers in Supabase for the Choices platform.

## Currently Supported Providers

### ✅ Fully Implemented
- **Google** - `google`
- **GitHub** - `github`

### 🔧 Ready for Configuration
- **Facebook** - `facebook` (also handles Instagram)
- **Twitter/X** - `twitter`
- **LinkedIn** - `linkedin`
- **Discord** - `discord`

### 🚧 Future Implementation
- **Instagram** - Uses Facebook OAuth (configured as `facebook`)
- **TikTok** - Not yet supported by Supabase

## Environment Variables

Add these to your `.env.local` file:

```bash
# OAuth Provider Configuration
NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,github,facebook,twitter,linkedin,discord

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Dashboard Configuration

### 1. Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy App ID and App Secret
6. In Supabase Dashboard → Authentication → Providers → Facebook:
   - Enable Facebook provider
   - Enter App ID and App Secret
   - Set redirect URL to your Supabase auth callback

### 2. Twitter OAuth Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Configure callback URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy API Key and API Secret
6. In Supabase Dashboard → Authentication → Providers → Twitter:
   - Enable Twitter provider
   - Enter API Key and API Secret
   - Set redirect URL to your Supabase auth callback

### 3. LinkedIn OAuth Setup
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Configure OAuth 2.0 settings
4. Add redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy Client ID and Client Secret
6. In Supabase Dashboard → Authentication → Providers → LinkedIn:
   - Enable LinkedIn provider
   - Enter Client ID and Client Secret
   - Set redirect URL to your Supabase auth callback

### 4. Discord OAuth Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy Client ID and Client Secret
6. In Supabase Dashboard → Authentication → Providers → Discord:
   - Enable Discord provider
   - Enter Client ID and Client Secret
   - Set redirect URL to your Supabase auth callback

## Testing OAuth Providers

### Development Testing
1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/register`
3. Test each OAuth provider button
4. Verify successful authentication and redirect

### Production Testing
1. Deploy to production
2. Test OAuth flow in production environment
3. Verify user data is properly stored
4. Test user profile creation

## User Data Mapping

When users authenticate via OAuth, the following data is collected:

```typescript
interface OAuthUserData {
  id: string
  email: string
  name?: string
  avatar_url?: string
  provider: OAuthProvider
  provider_user_id: string
}
```

## Security Considerations

1. **Redirect URLs**: Always use HTTPS in production
2. **Environment Variables**: Never commit OAuth secrets to version control
3. **Rate Limiting**: Implement rate limiting on OAuth endpoints
4. **Data Validation**: Validate all user data from OAuth providers
5. **Error Handling**: Implement proper error handling for OAuth failures

## Troubleshooting

### Common Issues

1. **"OAuth provider not configured" error**
   - Check if provider is enabled in Supabase Dashboard
   - Verify environment variables are set correctly
   - Ensure provider is included in `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS`

2. **Redirect URI mismatch**
   - Verify redirect URLs match exactly in both Supabase and OAuth provider settings
   - Check for trailing slashes or protocol mismatches

3. **Authentication fails**
   - Check browser console for errors
   - Verify OAuth provider credentials are correct
   - Ensure Supabase project is properly configured

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_OAUTH=true
```

This will log OAuth flow details to the browser console.

## Future Enhancements

1. **TikTok OAuth**: Implement when Supabase adds support
2. **Custom OAuth Providers**: Add support for enterprise SSO
3. **OAuth Analytics**: Track OAuth provider usage
4. **Advanced Permissions**: Request additional scopes when needed
