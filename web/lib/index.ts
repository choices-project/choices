// Explicit re-exports to resolve ambiguity
export type { CoreTrustTier, CoreUser, CoreDatabase } from './core'
// export type { DeviceFingerprint as SharedDeviceFingerprint } from './shared' // DISABLED: shared directory moved

// Use explicit re-exports to resolve duplicate export conflicts
export type { BreakingNewsStory as CoreBreakingNewsStory } from './core'
export type { PollContext as CorePollContext } from './core'

export type { DeviceFingerprint as CoreDeviceFingerprint } from './core'

// Export everything else normally (excluding the conflicting exports above)
// We need to be selective to avoid conflicts - only export from core for now
export * from './core'
