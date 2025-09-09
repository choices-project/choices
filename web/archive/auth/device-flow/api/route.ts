import { NextRequest, NextResponse } from 'next/server'
import { DeviceFlowManager, DeviceFlowRequest } from '@/lib/device-flow'
import { rateLimiters } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 device flow requests per minute per IP
    const rateLimitResult = await rateLimiters.deviceFlow.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many device flow requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { provider, redirectTo, scopes } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders = ['google', 'github', 'facebook', 'twitter', 'linkedin', 'discord']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Create device flow request
    const deviceFlowRequest: DeviceFlowRequest = {
      provider,
      redirectTo,
      scopes
    }

    // Create device flow
    const result = await DeviceFlowManager.createDeviceFlow(deviceFlowRequest)

    if (!result.success) {
      logger.error('Device flow creation failed', new Error(result.error || 'Unknown error'))
      return NextResponse.json(
        { error: result.error || 'Failed to create device flow' },
        { status: 500 }
      )
    }

    // Log successful device flow creation
    logger.info('Device flow created via API', {
      provider,
      ip: rateLimitResult.reputation?.ip || 'unknown',
      deviceCode: result.deviceCode
    })

    // Return device flow data
    return NextResponse.json({
      success: true,
      deviceCode: result.deviceCode,
      userCode: result.userCode,
      verificationUri: result.verificationUri,
      expiresIn: result.expiresIn,
      interval: result.interval
    })

  } catch (error) {
    logger.error('Device flow API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
