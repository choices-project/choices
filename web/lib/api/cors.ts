import { NextResponse } from 'next/server'

/**
 * Adds CORS headers to a NextResponse
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-e2e-bypass')
  return response
}

/**
 * Creates a JSON response with CORS headers
 */
export function createCorsResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  return addCorsHeaders(response)
}

/**
 * Creates an error response with CORS headers
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  const response = NextResponse.json({ error: message }, { status })
  return addCorsHeaders(response)
}
