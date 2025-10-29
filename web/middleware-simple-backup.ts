import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 SIMPLE MIDDLEWARE: Processing request for ${pathname}`);
  
  // Simple redirect test for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    console.log(`🚨 SIMPLE MIDDLEWARE: Redirecting ${pathname} to auth`);
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
