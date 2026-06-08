import { cookies } from 'next/headers';
import { getAdminAuth } from './admin';

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
}

export async function getVerifiedUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        console.error("Auth verification error:", error);
        return null;
    }
}

export async function getVerifiedAdmin() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
        const tokenEmail = (decodedToken.email as string | undefined);
        if (!isAdminEmail(tokenEmail)) return null;
        return decodedToken;
    } catch (error) {
        console.error("Admin auth verification error:", error);
        return null;
    }
}

export { isAdminEmail };
