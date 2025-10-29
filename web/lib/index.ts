// Explicit re-exports to resolve ambiguity
export type { CoreTrustTier, CoreUser } from './core'
// export type { DeviceFingerprint as SharedDeviceFingerprint } from './shared' // DISABLED: shared directory moved

// Use explicit re-exports to resolve duplicate export conflicts
// Note: BreakingNewsStory and PollContext were removed during cleanup
// export type { BreakingNewsStory as CoreBreakingNewsStory } from './core'
// export type { BreakingNewsStory as AdminBreakingNewsStory } from './admin'

// export type { PollContext as CorePollContext } from './core'
// export type { PollContext as AdminPollContext } from './admin'

// Export everything else normally (excluding the conflicting exports above)
// We need to be selective to avoid conflicts - only export from core for now
export * from './core'
