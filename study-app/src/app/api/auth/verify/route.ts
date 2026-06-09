import { NextResponse, NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/firebase/auth-helper";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // checkRevoked=false: this runs on every page navigation (via middleware),
        // and checkRevoked=true forces a network round-trip to Google each time.
        // The session cookie is short-lived (5 days) and cleared on logout, so the
        // local signature check is sufficient here.
        const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, false);
        const tokenEmail = decodedToken.email as string | undefined;

        return NextResponse.json({
            status: 'success',
            uid: decodedToken.uid,
            email: tokenEmail,
            emailVerified: decodedToken.email_verified,
            isAdmin: isAdminEmail(tokenEmail),
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

