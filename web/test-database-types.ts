import type { Database } from './types/database-minimal'

// Test that we can access key table types
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Poll = Database['public']['Tables']['polls']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];
type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row'];
type AdminActivity = Database['public']['Tables']['admin_activity_log']['Row'];
type TrustTierAnalytics = Database['public']['Tables']['trust_tier_analytics']['Row'];
type PrivacyLog = Database['public']['Tables']['privacy_logs']['Row'];
type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];

// Test that we can access key properties
type UserId = UserProfile['user_id'];
type PollId = Poll['id'];
type VoteId = Vote['id'];
type CredentialId = WebAuthnCredential['id'];

// Test that we can access nested properties
type UserEmail = UserProfile['email'];
type UserTrustTier = UserProfile['trust_tier'];
type UserIsAdmin = UserProfile['is_admin'];

// Test that we can access complex types
type UserPreferences = UserProfile['preferences'];
type UserPrivacySettings = UserProfile['privacy_settings'];

console.log('All database types are properly accessible!');
