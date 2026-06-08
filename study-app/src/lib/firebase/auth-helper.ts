import { cookies } from 'next/headers';
import { getAdminAuth } from './admin';

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

        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        if (!adminEmail) {
            console.error("ADMIN_EMAIL environment variable not set");
            return null;
        }

        const tokenEmail = (decodedToken.email as string | undefined)?.trim();
        if (tokenEmail !== adminEmail) return null;

        return decodedToken;
    } catch (error) {
        console.error("Admin auth verification error:", error);
        return null;
    }
}
