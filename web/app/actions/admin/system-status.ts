'use server'

import { z } from 'zod'

import { getSupabaseServerClient } from '@/utils/supabase/server'

import { PROFILE_SELECT_COLUMNS } from '@/lib/api/response-builders'
import {
  createSecureServerAction,
  requireAdmin,
  logSecurityEvent,
  createSuccessResponse,
  validateFormData,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'

// Validation schema for system status updates
const SystemStatusSchema = z.object({
  action: z.enum(['get_status', 'update_config', 'clear_cache']),
  configKey: z.string().optional(),
  configValue: z.string().optional()
})

// Enhanced admin system status action with security features
export const systemStatus = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const supabase = getSupabaseServerClient();
    
    // Require admin access
    const admin = await requireAdmin(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, SystemStatusSchema)

    try {
      const supabaseClient = await supabase
      
      if (!supabaseClient) {
        throw new Error('Supabase client not available')
      }
      
      switch (validatedData.action) {
        case 'get_status': {
          // Get system status
          const { data: systemConfig } = await supabaseClient
            .from('user_profiles')
            .select(PROFILE_SELECT_COLUMNS)
            .order('created_at', { ascending: false })
            .limit(10)

          const { data: userCount } = await supabaseClient
            .from('user_profiles')
            .select('id', { count: 'exact' })

          const { data: pollCount } = await supabaseClient
            .from('polls')
            .select('id', { count: 'exact' })

          const systemStatus = {
            timestamp: new Date().toISOString(),
            config: systemConfig ?? [],
            stats: {
              users: userCount ?? 0,
              polls: pollCount ?? 0
            },
            environment: process.env['NODE_ENV'],
            version: process.env['npm_package_version'] ?? '1.0.0'
          }

          // Log admin system status check
          logSecurityEvent('ADMIN_SYSTEM_STATUS_CHECK', {
            adminId: admin.userId,
            action: 'get_status'
          }, context)

          return createSuccessResponse(systemStatus, 'System status retrieved successfully');
        }

        case 'update_config': {
          if (!validatedData.configKey || !validatedData.configValue) {
            throw new Error('Config key and value are required')
          }

          // Update system configuration (using user_profiles table for now)
          // First get the current user profile
          type UserProfilePreferences = {
            preferences?: Record<string, unknown>
          }
          const { data: userProfile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('preferences')
            .eq('user_id', admin.userId)
            .single()

          if (profileError) {
            throw new Error(`Failed to get user profile: ${profileError.message}`)
          }

          const profileData = userProfile as UserProfilePreferences | null
          const { error: updateError } = await supabaseClient
            .from('user_profiles')
            .update({
              preferences: {
                ...(profileData?.preferences ?? {}),
                [validatedData.configKey]: validatedData.configValue
              },
              updated_at: new Date().toISOString()
            })
            .eq('user_id', admin.userId)

          if (updateError) {
            throw new Error('Failed to update system configuration')
          }

          // Log admin config update
          logSecurityEvent('ADMIN_CONFIG_UPDATE', {
            adminId: admin.userId,
            configKey: validatedData.configKey,
            configValue: validatedData.configValue
          }, context)

          return createSuccessResponse(
            { key: validatedData.configKey, value: validatedData.configValue },
            'System configuration updated successfully'
          );
        }

        case 'clear_cache': {
          // Clear system cache using real cache management
          const { CivicsCache } = await import('@/lib/utils/civics-cache')
          const { CacheStrategyManager } = await import('@/lib/cache/cache-strategies')
          const { RedisClient } = await import('@/lib/cache/redis-client')
          
          // Clear civics cache
          CivicsCache.clearAll()
          
          // Clear Redis cache using cache strategy manager
          const redisClient = new RedisClient()
          const cacheManager = new CacheStrategyManager(redisClient)
          const invalidationResult = await cacheManager.invalidate('*', {
            reason: 'admin_cache_clear',
            tags: ['system', 'admin']
          })
          
          // Log admin cache clear
          logSecurityEvent('ADMIN_CACHE_CLEAR', {
            adminId: admin.userId,
            action: 'clear_cache',
            invalidatedKeys: invalidationResult.invalidated,
            errors: invalidationResult.errors
          }, context)

          return createSuccessResponse({
            civicsCache: 'cleared',
            redisCache: {
              invalidatedKeys: invalidationResult.invalidated,
              errors: invalidationResult.errors
            }
          }, 'System cache cleared successfully');
        }

        default:
          throw new Error('Invalid action');
      }
    } catch (error) {
      // Log admin action failure
      logSecurityEvent('ADMIN_ACTION_FAILED', {
        adminId: admin.userId,
        action: validatedData.action,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, context)

      throw error
    }
  }
)
