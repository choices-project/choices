/**
 * Protected Route Template
 * 
 * This demonstrates the new server-side authentication architecture.
 * Use this pattern for all protected API routes.
 */

import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/core/auth/middleware';
import { requireTrustedOrigin } from '@/lib/http';

// Cache guards for auth routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // For handlers using pg, crypto, or service role

// POST /api/protected-example - Example protected route
export async function POST(req: Request) {
  try {
    // 1. Origin validation (CSRF protection)
    requireTrustedOrigin(req);
    
    // 2. Authentication check
    const user = await requireUser(req);
    
    // 3. Parse and validate request body
    const body = await req.json();
    
    // 4. Perform authorized work
    const result = {
      message: 'Success!',
      userId: user.id,
      timestamp: new Date().toISOString(),
      requestData: body // Include request data for audit trail
    };
    
    // 5. Return response with security headers
    return NextResponse.json(result, {
      headers: { 
        'Cache-Control': 'no-store', 
        'Vary': 'Cookie' 
      },
    });
    
  } catch (e: any) {
    console.error('Protected route error:', e);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

// GET /api/protected-example - Example protected read route
export async function GET(req: Request) {
  try {
    // 1. Authentication check (no origin validation for GET)
    const user = await requireUser(req);
    
    // 2. Perform authorized read operation
    const data = {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    };
    
    // 3. Return response with security headers
    return NextResponse.json(data, {
      headers: { 
        'Cache-Control': 'no-store', 
        'Vary': 'Cookie' 
      },
    });
    
  } catch (e: any) {
    console.error('Protected route GET error:', e);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
