'use server'

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { 
  createSecureServerAction,
  requireAdmin,
  logSecurityEvent,
  createSuccessResponse,
  validateFormData,
  type ServerActionContext
} from '@/lib/auth/server-actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema for system status updates
const SystemStatusSchema = z.object({
  action: z.enum(['get_status', 'update_config', 'clear_cache']),
  configKey: z.string().optional(),
  configValue: z.string().optional()
})

// Enhanced admin system status action with security features
export const systemStatus = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    // Require admin access
    const admin = await requireAdmin(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, SystemStatusSchema)

    try {
      switch (validatedData.action) {
        case 'get_status':
          // Get system status
          const { data: systemConfig } = await supabase
            .from('system_configuration')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

          const { data: userCount } = await supabase
            .from('user_profiles')
            .select('id', { count: 'exact' })

          const { data: pollCount } = await supabase
            .from('polls')
            .select('id', { count: 'exact' })

          const systemStatus = {
            timestamp: new Date().toISOString(),
            config: systemConfig || [],
            stats: {
              users: userCount || 0,
              polls: pollCount || 0
            },
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0'
          }

          // Log admin system status check
          logSecurityEvent('ADMIN_SYSTEM_STATUS_CHECK', {
            adminId: admin.userId,
            action: 'get_status'
          }, context)

          return createSuccessResponse(systemStatus, 'System status retrieved successfully')

        case 'update_config':
          if (!validatedData.configKey || !validatedData.configValue) {
            throw new Error('Config key and value are required')
          }

          // Update system configuration
          const { error: updateError } = await supabase
            .from('system_configuration')
            .insert({
              key: validatedData.configKey,
              value: validatedData.configValue,
              updated_by: admin.userId,
              created_at: new Date().toISOString()
            })

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
          )

        case 'clear_cache':
          // Clear system cache (placeholder for cache clearing logic)
          // In a real implementation, you would clear Redis cache, CDN cache, etc.
          
          // Log admin cache clear
          logSecurityEvent('ADMIN_CACHE_CLEAR', {
            adminId: admin.userId,
            action: 'clear_cache'
          }, context)

          return createSuccessResponse({}, 'System cache cleared successfully')

        default:
          throw new Error('Invalid action')
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
  },
  {
    requireAuth: true,
    requireAdmin: true,
    validation: SystemStatusSchema,
    rateLimit: { endpoint: '/admin/system-status', maxRequests: 100 }
  }
)
