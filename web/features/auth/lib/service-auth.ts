/**
 * Service Key Authentication
 * 
 * This provides authentication using the service key for admin operations
 * that don't require user session authentication.
 */


// Load environment variables

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

// Environment variables are automatically loaded by Next.js from .env.local

export async function requireServiceKey(): Promise<NextResponse | null> {
  try {
    // Check if we have the service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
    }

    // Verify the service key by creating a client and testing it
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // Test the service key by making a simple query
    const { error } = await supabase
      .from('representatives_core')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ error: 'Invalid service key' }, { status: 401 });
    }

    return null; // Service key is valid
  } catch (error) {
    logger.error('Service key validation error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Service key validation failed' }, { status: 500 });
  }
}

export async function isServiceKeyValid(): Promise<boolean> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase
      .from('representatives_core')
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
