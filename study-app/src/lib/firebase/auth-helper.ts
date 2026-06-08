import { cookies } from 'next/headers';
import { adminAuth } from './admin';

/**
 * Verifies the session cookie from the incoming request and returns the decoded user token.
 * @returns The decoded user token if the session is valid, otherwise null.
 */
export async function getVerifiedUser() {
    if (!adminAuth) {
        console.error("Firebase Admin not initialized");
        return null;
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        // Session cookie is invalid.
        // It's good practice to clear the invalid cookie from the client,
        // but we can't set cookies in a server component or from here directly.
        // The middleware should handle clearing invalid cookies on redirects.
        console.error("Auth verification error:", error);
        return null;
    }
}

/**
 * Verifies that the current user is an authenticated admin.
 * @returns The decoded user token if the session is valid and user is admin, otherwise null.
 */
export async function getVerifiedAdmin() {
    if (!adminAuth) {
        console.error("Firebase Admin not initialized");
        return null;
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Use email from the token claims directly — avoids an extra getUser() network call
        // that can fail/timeout in serverless environments.
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        if (!adminEmail) {
            console.error("ADMIN_EMAIL environment variable not set");
            return null;
        }
        
        const tokenEmail = (decodedToken.email as string | undefined)?.trim();
        if (tokenEmail !== adminEmail) {
            return null;
        }
        
        return decodedToken;
    } catch (error) {
        console.error("Admin auth verification error:", error);
        return null;
    }
}
