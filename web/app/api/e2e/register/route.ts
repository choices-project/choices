import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import { 
  validateCsrfProtection, 
  createCsrfErrorResponse 
} from '../../auth/_shared';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const isE2E = request.headers.get('x-e2e-bypass') === '1' || 
                process.env.NODE_ENV === 'test' || 
                process.env.E2E === '1';
  
  if (!isE2E) {
    return forbiddenError('E2E endpoint not available');
  }

  if (!validateCsrfProtection(request)) {
    return createCsrfErrorResponse();
  }

  const body = await request.json();
  const { email, password, username, display_name } = body;

  if (!email || !password || !username) {
    return validationError({
      email: !email ? 'Email is required' : '',
      password: !password ? 'Password is required' : '',
      username: !username ? 'Username is required' : ''
    });
  }

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return validationError({ username: 'Username must be 3-20 characters, letters, numbers, hyphens, and underscores only' });
  }

  if (password.length < 8) {
    return validationError({ password: 'Password must be at least 8 characters long' });
  }

    // For E2E testing, we'll create a mock user response
    // In a real implementation, you might want to create a test user in the database
    const mockUserId = `e2e-user-${Date.now()}`;
    
    logger.info('E2E test user created', { 
      userId: mockUserId, 
      email, 
      username 
    });

  return successResponse({
    user: {
      id: mockUserId,
      email: email.toLowerCase().trim(),
      username: username,
      trust_tier: 'T0',
      display_name: display_name || username,
      is_active: true
    },
    message: 'E2E test user created successfully. Redirecting to onboarding...'
  }, undefined, 201);
});
