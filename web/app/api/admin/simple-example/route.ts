import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { requireAdminOr401, getAdminUser } from '@/lib/admin-auth'

/**
 * Simple Admin API Example
 * 
 * This shows the unified admin auth pattern using requireAdminOr401.
 * Clean, secure, and consistent across all admin APIs.
 */

export async function GET(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  // Get admin user info
  const adminUser = await getAdminUser()
  
  return NextResponse.json({
    message: 'Admin access granted',
    user: {
      id: adminUser?.id,
      email: adminUser?.email
    },
    timestamp: new Date().toISOString()
  })
}