// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/authUtils'; // Ensure path is correct

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicApiPaths = ['/api/auth/login', '/api/auth/register'];

  // Allow requests to public API paths
  if (publicApiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all paths under /api/database, verify authentication
  if (pathname.startsWith('/api/database')) {
    const authenticatedUser = verifyAuth(request);
    if (!authenticatedUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Add user information to request headers for API routes to access
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authenticatedUser.userID);
    requestHeaders.set('x-user-username', authenticatedUser.username);
    requestHeaders.set('x-user-is-admin', String(authenticatedUser.isAdmin));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For frontend paths like /dashboard, redirect to /login if not authenticated
  // This part is more for UI/UX and might be adjusted based on frontend routing.
  // For now, we'll focus on API protection.
  // Example:
  // if (pathname.startsWith('/dashboard')) {
  //   const authenticatedUser = verifyAuth(request);
  //   if (!authenticatedUser) {
  //     const loginUrl = new URL('/login', request.url);
  //     loginUrl.searchParams.set('redirect_to', pathname); // Optional: redirect back after login
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  // Middleware will run on these paths
  // Adjusted to primarily protect /api/database and allow auth endpoints
  matcher: [
    '/api/database/:path*',
    // '/dashboard/:path*', // Uncomment if you have frontend dashboard routes to protect
    // Ensure auth paths are NOT matched here if they are handled as public above
  ],
};
