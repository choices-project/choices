// Test file to verify database schema import
import type { Database } from './types/database-minimal'

// Test if we can access table types
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Poll = Database['public']['Tables']['polls']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

// Test if we can access specific properties
type UserId = UserProfile['user_id']
type PollTitle = Poll['title']
type VoteOption = Vote['option']

console.log('Database import test successful')
