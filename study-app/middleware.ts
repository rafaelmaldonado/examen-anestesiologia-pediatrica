import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // If we are already on the auth page, don't do anything
  if (request.nextUrl.pathname === '/auth') {
    const response = NextResponse.next();
    // Add security headers to help with storage access
    response.headers.set('Permissions-Policy', 'storage-access=*');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return response;
  }

  if (!sessionCookie) {
    const redirectResponse = NextResponse.redirect(new URL('/auth', request.url));
    // Add security headers
    redirectResponse.headers.set('Permissions-Policy', 'storage-access=*');
    redirectResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return redirectResponse;
  }

  // To avoid an infinite loop, we construct the verification URL making sure
  // it's the absolute URL of the deployed application.
  const verifyUrl = new URL('/api/auth/verify', request.url);

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        'Cookie': `session=${sessionCookie}`
      }
    });

    // If the token is invalid, the API returns 401
    if (response.status !== 200) {
      // Clear the invalid cookie and redirect
      const redirectResponse = NextResponse.redirect(new URL('/auth', request.url));
      redirectResponse.cookies.delete('session');
      // Add security headers
      redirectResponse.headers.set('Permissions-Policy', 'storage-access=*');
      redirectResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      return redirectResponse;
    }

    // If accessing admin routes, verify admin permissions
    if (isAdminRoute) {
      const userInfo = await response.json();
      const adminEmail = process.env.ADMIN_EMAIL;
      
      if (!adminEmail) {
        console.error("ADMIN_EMAIL environment variable not set");
        const redirectResponse = NextResponse.redirect(new URL('/', request.url));
        redirectResponse.headers.set('Permissions-Policy', 'storage-access=*');
        redirectResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        return redirectResponse;
      }
      
      if (userInfo.email !== adminEmail) {
        // Redirect non-admin users to the main page
        const redirectResponse = NextResponse.redirect(new URL('/', request.url));
        redirectResponse.headers.set('Permissions-Policy', 'storage-access=*');
        redirectResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        return redirectResponse;
      }
    }

    // If token is valid, let the request through
    const validResponse = NextResponse.next();
    // Add security headers
    validResponse.headers.set('Permissions-Policy', 'storage-access=*');
    validResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return validResponse;

  } catch (error) {
    console.error("Middleware fetch error:", error);
    // In case of a network or other error, redirect to auth as a fallback
    const errorResponse = NextResponse.redirect(new URL('/auth', request.url));
    // Add security headers
    errorResponse.headers.set('Permissions-Policy', 'storage-access=*');
    errorResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return errorResponse;
  }
}

// This middleware only runs on routes matching the matcher
export const config = {
  matcher: ['/admin/:path*', '/quiz/:path*'],
};
