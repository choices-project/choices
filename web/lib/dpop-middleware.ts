/**
 * DPoP Middleware for API Routes
 * Provides DPoP validation for enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface DPoPValidationResult {
  valid: boolean;
  error?: string;
  jkt?: string;
  jti?: string;
}

/**
 * DPoP middleware for API routes
 */
export function withDPoP(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      // Extract DPoP proof from headers
      const authHeader = request.headers.get('authorization');
      const dpopHeader = request.headers.get('dpop');
      
      if (!authHeader?.startsWith('DPoP ')) {
        return NextResponse.json(
          { error: 'DPoP authorization required' },
          { status: 401 }
        );
      }

      if (!dpopHeader) {
        return NextResponse.json(
          { error: 'DPoP proof required' },
          { status: 401 }
        );
      }

      // Parse DPoP proof
      const proof = JSON.parse(dpopHeader);
      
      // Validate DPoP proof structure
      if (!proof.jkt || !proof.htm || !proof.htu) {
        return NextResponse.json(
          { error: 'Invalid DPoP proof structure' },
          { status: 401 }
        );
      }

      // Validate HTTP method and URI
      if (proof.htm !== request.method.toUpperCase()) {
        return NextResponse.json(
          { error: 'HTTP method mismatch' },
          { status: 401 }
        );
      }

      // Extract token from Authorization header
      const token = authHeader.replace('DPoP ', '');
      
      // Validate DPoP binding with database
      const isValid = await validateDPoPBinding(token, proof.jkt, proof.jti);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid DPoP binding' },
          { status: 401 }
        );
      }

      // Continue with the original handler
      return handler(request, context);
    } catch (error) {
      console.error('DPoP middleware error:', error);
      return NextResponse.json(
        { error: 'DPoP validation failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Validate DPoP binding for a session
 */
async function validateDPoPBinding(
  sessionId: string,
  jkt: string,
  jti: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc('validate_dpop_binding', {
      p_session_id: sessionId,
      p_dpop_jkt: jkt,
      p_dpop_nonce: jti,
    });

    if (error) {
      console.error('DPoP validation error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('DPoP validation error:', error);
    return false;
  }
}

/**
 * Extract DPoP proof from request headers
 */
export function extractDPoPProof(request: NextRequest) {
  const dpopHeader = request.headers.get('dpop');
  if (!dpopHeader) {
    return null;
  }

  try {
    return JSON.parse(dpopHeader);
  } catch (error) {
    console.error('Failed to parse DPoP proof:', error);
    return null;
  }
}

/**
 * Validate DPoP proof structure
 */
export function validateDPoPProofStructure(proof: any): DPoPValidationResult {
  if (!proof) {
    return { valid: false, error: 'Missing DPoP proof' };
  }

  if (!proof.jkt) {
    return { valid: false, error: 'Missing JKT in DPoP proof' };
  }

  if (!proof.htm) {
    return { valid: false, error: 'Missing HTTP method in DPoP proof' };
  }

  if (!proof.htu) {
    return { valid: false, error: 'Missing HTTP URI in DPoP proof' };
  }

  if (!proof.jti) {
    return { valid: false, error: 'Missing JTI in DPoP proof' };
  }

  if (!proof.iat) {
    return { valid: false, error: 'Missing issued at time in DPoP proof' };
  }

  // Check if proof is not too old (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (now - proof.iat > 300) {
    return { valid: false, error: 'DPoP proof too old' };
  }

  return {
    valid: true,
    jkt: proof.jkt,
    jti: proof.jti,
  };
}

