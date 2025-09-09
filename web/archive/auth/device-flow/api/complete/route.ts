import { NextRequest, NextResponse } from 'next/server'
import { DeviceFlowManager } from '@/lib/device-flow'
import { rateLimiters } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 completion requests per minute per IP
    const rateLimitResult = await rateLimiters.deviceFlow.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many completion requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { userCode, userId } = body

    if (!userCode || !userId) {
      return NextResponse.json(
        { error: 'User code and user ID are required' },
        { status: 400 }
      )
    }

    // Validate user code format
    if (!/^[A-Z0-9]{8}$/.test(userCode)) {
      return NextResponse.json(
        { error: 'Invalid user code format' },
        { status: 400 }
      )
    }

    // Validate user ID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    // Complete device flow
    const result = await DeviceFlowManager.completeDeviceFlow(userCode, userId)

    if (!result) {
      logger.warn('Device flow completion failed', {
        userCode,
        userId,
        ip: rateLimitResult.reputation?.ip || 'unknown'
      })

      return NextResponse.json(
        { error: 'Failed to complete device flow' },
        { status: 400 }
      )
    }

    // Log successful completion
    logger.info('Device flow completed successfully', {
      userCode,
      userId,
      ip: rateLimitResult.reputation?.ip || 'unknown'
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Device flow completed successfully'
    })

  } catch (error) {
    logger.error('Device flow completion API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
