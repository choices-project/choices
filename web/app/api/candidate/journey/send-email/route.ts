import type { NextRequest, NextResponse } from 'next/server'

import { withErrorHandling } from '@/lib/api';

// Maintain backwards compatibility: redirect singular path to plural
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/candidate/journey/send-email', '/api/candidates/journey/send-email');
  return Response.redirect(url, 308) as unknown as NextResponse;
});

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/candidate/journey/send-email', '/api/candidates/journey/send-email');
  return Response.redirect(url, 308) as unknown as NextResponse;
});

