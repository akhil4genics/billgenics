import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public exceptions inside otherwise-protected areas
  const isPublicException =
    pathname.startsWith('/events/join/');

  const isProtectedRoute =
    !isPublicException &&
    ['/account', '/dashboard', '/bills', '/events', '/admin'].some((path) =>
      pathname.startsWith(path)
    );

  if (isProtectedRoute) {
    // Check for session token
    const token = request.cookies.get('authjs.session-token') ||
                  request.cookies.get('__Secure-authjs.session-token');

    if (!token) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/dashboard/:path*', '/bills/:path*', '/events/:path*', '/admin/:path*'],
};
