/**
 * Device Flow Authentication System
 * 
 * Implements OAuth 2.0 Device Authorization Grant flow for secure cross-device authentication.
 * This system allows users to authenticate on one device using another device (e.g., TV + phone).
 * 
 * Security Features:
 * - Cryptographically secure device codes
 * - Rate limiting and abuse prevention
 * - Automatic expiration and cleanup
 * - Audit logging for security monitoring
 * - Session validation and verification
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2024-12-27
 */


import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { withOptional } from '@/lib/util/objects'
import type { Session } from '@supabase/supabase-js'
import type { DeviceFlowRecord } from './types'

export type DeviceFlowState = {
  deviceCode: string
  userCode: string
  verificationUri: string
  expiresIn: number
  interval: number
  status: 'pending' | 'completed' | 'expired' | 'error'
  userId?: string
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  createdAt: Date
  expiresAt: Date
}

export type DeviceFlowRequest = {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  redirectTo?: string
  scopes?: string[]
}

export type DeviceFlowResponse = {
  success: boolean
  deviceCode?: string
  userCode?: string
  verificationUri?: string
  expiresIn?: number
  interval?: number
  error?: string
}

export type DeviceFlowVerification = {
  success: boolean
  userId?: string
  session?: Session
  error?: string
}

/**
 * Device Flow Manager
 * Handles the complete device flow lifecycle with security and performance optimizations
 */
export class DeviceFlowManager {
  private static readonly CODE_LENGTH = 8
  private static readonly EXPIRATION_MINUTES = 10
  private static readonly POLLING_INTERVAL_SECONDS = 5
  private static readonly MAX_ACTIVE_FLOWS_PER_IP = 5
  private static readonly RATE_LIMIT_WINDOW_MS = 60000 // 1 minute

  /**
   * Generate a cryptographically secure device code
   */
  private static generateSecureCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const array = new Uint8Array(this.CODE_LENGTH)
    crypto.getRandomValues(array)
    
    let result = ''
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      const value = array[i]
      if (value !== undefined) {
        result += chars[value % chars.length]
      }
    }
    
    return result
  }

  /**
   * Create a new device flow for authentication
   */
  static async createDeviceFlow(request: DeviceFlowRequest): Promise<DeviceFlowResponse> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Rate limiting check
      const clientIp = await this.getClientIP()
      const activeFlows = await this.getActiveFlowsForIP(clientIp)
      
      if (activeFlows.length >= this.MAX_ACTIVE_FLOWS_PER_IP) {
        logger.warn('Rate limit exceeded for device flow', { ip: clientIp })
        return {
          success: false,
          error: 'Too many active device flows. Please wait before trying again.'
        }
      }

      // Generate secure codes
      const deviceCode = this.generateSecureCode()
      const userCode = this.generateSecureCode()
      
      // Calculate expiration
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.EXPIRATION_MINUTES * 60 * 1000)

      // Store device flow in database
      const supabaseClient = await supabase;
      const { error: insertError } = await supabaseClient
        .from('device_flows')
        .insert({
          device_code: deviceCode,
          user_code: userCode,
          provider: request.provider,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          client_ip: clientIp,
          redirect_to: request.redirectTo || '/dashboard',
          scopes: request.scopes || []
        })

      if (insertError) {
        logger.error('Failed to create device flow', new Error(insertError.message))
        throw new Error('Failed to create device flow')
      }

      // Log device flow creation
      logger.info('Device flow created', {
        deviceCode,
        userCode,
        provider: request.provider,
        ip: clientIp
      })

      return {
        success: true,
        deviceCode,
        userCode,
        verificationUri: this.getVerificationUri(request.provider),
        expiresIn: this.EXPIRATION_MINUTES * 60,
        interval: this.POLLING_INTERVAL_SECONDS
      }

    } catch (error) {
      logger.error('Device flow creation failed', error instanceof Error ? error : new Error('Unknown error'))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify device flow completion and return user session
   */
  static async verifyDeviceFlow(deviceCode: string): Promise<DeviceFlowVerification> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const supabaseClient = await supabase;

      // Get device flow from database
      const { data: deviceFlow, error: fetchError } = await supabaseClient
        .from('device_flows')
        .select('*')
        .eq('device_code', deviceCode)
        .single()

      if (fetchError || !deviceFlow) {
        return {
          success: false,
          error: 'Invalid or expired device code'
        }
      }

      // Check if expired
      if (deviceFlow && !('error' in deviceFlow) && new Date() > new Date((deviceFlow as DeviceFlowRecord).expires_at)) {
        await this.markDeviceFlowExpired(deviceCode)
        return {
          success: false,
          error: 'Device flow has expired'
        }
      }

      // Check if completed
      if (deviceFlow && !('error' in deviceFlow) && (deviceFlow as DeviceFlowRecord).status === 'completed' && (deviceFlow as DeviceFlowRecord).user_id) {
        // Get user session
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        
        if (sessionError || !session) {
          return {
            success: false,
            error: 'Failed to retrieve user session'
          }
        }

        // Log successful verification
        logger.info('Device flow verified successfully', {
          deviceCode,
          userId: (deviceFlow as DeviceFlowRecord).user_id,
          provider: (deviceFlow as DeviceFlowRecord).provider
        })

        return withOptional({
          success: true,
          session
        }, {
          userId: (deviceFlow as DeviceFlowRecord).user_id
        })
      }

      // Still pending
      return {
        success: false,
        error: 'Device flow still pending'
      }

    } catch (error) {
      logger.error('Device flow verification failed', error instanceof Error ? error : new Error('Unknown error'))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Complete device flow with user authentication
   */
  static async completeDeviceFlow(userCode: string, userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const supabaseClient = await supabase;
      // Update device flow status
      const { error: updateError } = await supabaseClient
        .from('device_flows')
        .update({
          status: 'completed',
          user_id: userId,
          completed_at: new Date().toISOString()
        })
        .eq('user_code', userCode)
        .eq('status', 'pending')

      if (updateError) {
        logger.error('Failed to complete device flow', new Error(updateError.message))
        return false
      }

      logger.info('Device flow completed', { userCode, userId })
      return true

    } catch (error) {
      logger.error('Device flow completion failed', error instanceof Error ? error : new Error('Unknown error'))
      return false
    }
  }

  /**
   * Mark device flow as expired
   */
  private static async markDeviceFlowExpired(deviceCode: string): Promise<void> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) return

      const supabaseClient = await supabase
      await supabaseClient
        .from('device_flows')
        .update({ status: 'expired' })
        .eq('device_code', deviceCode)
        .eq('status', 'pending')

    } catch (error) {
      logger.error('Failed to mark device flow as expired', error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  /**
   * Get active device flows for IP address (rate limiting)
   */
  private static async getActiveFlowsForIP(clientIp: string): Promise<DeviceFlowRecord[]> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) return []

      const supabaseClient = await supabase
      const { data: flows } = await supabaseClient
        .from('device_flows')
        .select('*')
        .eq('client_ip', clientIp)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())

      return flows || []

    } catch (error) {
      logger.error('Failed to get active flows for IP', error instanceof Error ? error : new Error('Unknown error'))
      return []
    }
  }

  /**
   * Get client IP address
   */
  private static async getClientIP(): Promise<string> {
    // This would be implemented based on your server setup
    // For now, return a placeholder
    return 'unknown'
  }

  /**
   * Get verification URI for provider
   */
  private static getVerificationUri(provider: string): string {
    const uris = {
      google: 'https://accounts.google.com/o/oauth2/device',
      github: 'https://github.com/login/device',
      facebook: 'https://www.facebook.com/device',
      twitter: 'https://api.twitter.com/oauth/authenticate',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      discord: 'https://discord.com/api/oauth2/authorize'
    }
    
    return uris[provider as keyof typeof uris] || uris.google
  }

  /**
   * Clean up expired device flows (should be run periodically)
   */
  static async cleanupExpiredFlows(): Promise<void> {
    try {
      const supabase = getSupabaseServerClient()
      if (!supabase) return

      const supabaseClient = await supabase
      const { error } = await supabaseClient
        .from('device_flows')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) {
        logger.error('Failed to cleanup expired flows', new Error(error.message))
      } else {
        logger.info('Expired device flows cleaned up')
      }

    } catch (error) {
      logger.error('Device flow cleanup failed', error instanceof Error ? error : new Error('Unknown error'))
    }
  }
}
