import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  // If we are already on the login page, don't do anything
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
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
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.delete('session');
      return redirectResponse;
    }

    // If token is valid, let the request through
    return NextResponse.next();

  } catch (error) {
    console.error("Middleware fetch error:", error);
    // In case of a network or other error, redirect to login as a fallback
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// This middleware only runs on routes matching the matcher
export const config = {
  matcher: ['/admin/:path*'],
};
