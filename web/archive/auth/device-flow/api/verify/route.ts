import { NextRequest, NextResponse } from 'next/server'
import { DeviceFlowManager } from '@/lib/device-flow'
import { rateLimiters } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 60 verification requests per minute per IP
    const rateLimitResult = await rateLimiters.deviceFlow.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { deviceCode } = body

    if (!deviceCode) {
      return NextResponse.json(
        { error: 'Device code is required' },
        { status: 400 }
      )
    }

    // Validate device code format
    if (!/^[A-Z0-9]{8}$/.test(deviceCode)) {
      return NextResponse.json(
        { error: 'Invalid device code format' },
        { status: 400 }
      )
    }

    // Verify device flow
    const result = await DeviceFlowManager.verifyDeviceFlow(deviceCode)

    if (!result.success) {
          // Log failed verification attempts for security monitoring
    logger.warn('Device flow verification failed', {
      deviceCode,
      ip: rateLimitResult.reputation?.ip || 'unknown',
      error: result.error
    })

      return NextResponse.json({
        success: false,
        error: result.error || 'Verification failed'
      })
    }

    // Log successful verification
    logger.info('Device flow verified successfully', {
      deviceCode,
      userId: result.userId,
      ip: rateLimitResult.reputation?.ip || 'unknown'
    })

    // Return verification result
    return NextResponse.json({
      success: true,
      userId: result.userId,
      session: result.session
    })

  } catch (error) {
    logger.error('Device flow verification API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
