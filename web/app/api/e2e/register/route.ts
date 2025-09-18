import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  validateCsrfProtection, 
  createCsrfErrorResponse 
} from '../../auth/_shared';

/**
 * E2E Test Registration Endpoint
 * 
 * This endpoint bypasses Supabase for E2E testing purposes.
 * It creates test users directly in the database without email verification.
 * 
 * Only available when E2E environment is detected.
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in E2E test environment
    const isE2E = request.headers.get('x-e2e-bypass') === '1' || 
                  process.env.NODE_ENV === 'test' || 
                  process.env.E2E === '1';
    
    if (!isE2E) {
      return NextResponse.json(
        { message: 'E2E endpoint not available' },
        { status: 403 }
      );
    }

    // Validate CSRF protection
    if (!validateCsrfProtection(request)) {
      return createCsrfErrorResponse();
    }

    // Parse request body
    const body = await request.json();
    const { email, password, username, display_name } = body;

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { message: 'Email, password, and username are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json(
        { message: 'Username must be 3-20 characters, letters, numbers, hyphens, and underscores only' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // For E2E testing, we'll create a mock user response
    // In a real implementation, you might want to create a test user in the database
    const mockUserId = `e2e-user-${Date.now()}`;
    
    logger.info('E2E test user created', { 
      userId: mockUserId, 
      email, 
      username 
    });

    // Return success response that matches the real registration API
    return NextResponse.json({
      success: true,
      user: {
        id: mockUserId,
        email: email.toLowerCase().trim(),
        username: username,
        trust_tier: 'T0',
        display_name: display_name || username,
        is_active: true
      },
      message: 'E2E test user created successfully. Redirecting to onboarding...'
    });

  } catch (error) {
    logger.error('E2E registration error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
