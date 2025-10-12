// Optimized Admin Implementation
// Enhanced admin system with performance monitoring and security
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Performance monitoring wrapper
export async function trackAdminPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log performance metrics
    logger.info(`Admin operation: ${operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Alert on slow operations
    if (duration > 2000) {
      logger.warn(`Slow admin operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logger.error(`Admin operation failed: ${operation} - ${error instanceof Error ? error.message : 'Unknown error'} (${duration.toFixed(2)}ms)`);
    
    throw error;
  }
}

// Admin activity logging
export async function logAdminAction(
  action: string,
  details: any,
  request: NextRequest
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('admin_activity_log').insert({
        admin_id: user.id,
        action,
        details,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to log admin action:', error instanceof Error ? error : new Error('Unknown error'));
  }
}

// Rate limiting for admin endpoints
export async function checkAdminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const supabase = await getSupabaseServerClient();
    
    // Check rate limit (10 requests per minute)
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ip)
      .eq('endpoint', 'admin')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());
    
    if (rateLimit && rateLimit.length >= 10) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }
    
    // Log request
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      endpoint: 'admin',
      request_count: 1
    });
    
    return null;
  } catch (error) {
    logger.error('Rate limit check failed:', error instanceof Error ? error : new Error('Unknown error'));
    return null; // Allow request if rate limit check fails
  }
}

// Optimized user management endpoint
export async function getOptimizedUsers(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await checkAdminRateLimit(request);
    if (rateLimit) return rateLimit;
    
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;
    
    // Log admin action
    await logAdminAction('admin_users_view', { endpoint: '/api/admin/users' }, request);
    
    // Get search parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    
    // Optimized user query with performance tracking
    const users = await trackAdminPerformance('get_users', async () => {
      const supabase = await getSupabaseServerClient();
      
      // Build optimized query
      let query = supabase
        .from('user_profiles')
        .select(`
          user_id, username, email, is_admin, is_active,
          created_at, updated_at, last_login_at, trust_tier
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (search) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      if (role === 'admin') {
        query = query.eq('is_admin', true);
      } else if (role === 'user') {
        query = query.eq('is_admin', false);
      }
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return { users: data || [], total: count || 0 };
    });
    
    return NextResponse.json({
      ok: true,
      data: users.users,
      pagination: {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        total: users.total,
        pages: Math.ceil(users.total / parseInt(searchParams.get('limit') || '20'))
      }
    });
    
  } catch (error) {
    logger.error('Admin users endpoint error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch users'
    }, { status: 500 });
  }
}

// Optimized system metrics endpoint
export async function getOptimizedSystemMetrics(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await checkAdminRateLimit(request);
    if (rateLimit) return rateLimit;
    
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;
    
    // Log admin action
    await logAdminAction('admin_metrics_view', { endpoint: '/api/admin/metrics' }, request);
    
    // Get system metrics with performance tracking
    const metrics = await trackAdminPerformance('get_system_metrics', async () => {
      const supabase = await getSupabaseServerClient();
      
      // Parallel queries for better performance
      const [
        usersResult,
        pollsResult,
        votesResult,
        feedbackResult,
        systemHealthResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('polls').select('id', { count: 'exact' }),
        supabase.from('votes').select('id', { count: 'exact' }),
        supabase.from('feedback').select('id', { count: 'exact' }),
        supabase.from('system_health').select('*').order('created_at', { ascending: false }).limit(1)
      ]);
      
      return {
        totalUsers: usersResult.count || 0,
        totalPolls: pollsResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalFeedback: feedbackResult.count || 0,
        systemHealth: systemHealthResult.data?.[0] || { status: 'healthy' },
        lastUpdated: new Date().toISOString()
      };
    });
    
    return NextResponse.json({
      ok: true,
      data: metrics
    });
    
  } catch (error) {
    logger.error('Admin metrics endpoint error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch system metrics'
    }, { status: 500 });
  }
}

// Enhanced error handling for all admin endpoints
export function handleAdminError(error: unknown, operation: string): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  logger.error(`Admin operation failed: ${operation} - ${errorMessage}`);
  
  return NextResponse.json({
    error: 'Internal server error',
    message: 'An error occurred while processing your request',
    timestamp: new Date().toISOString()
  }, { status: 500 });
}

// Note: This component would be implemented in a separate React component file
// This is just the service layer for admin operations
