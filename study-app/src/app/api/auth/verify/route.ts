import { NextResponse, NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);

        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        const tokenEmail = (decodedToken.email as string | undefined)?.trim();
        const isAdmin = !!(adminEmail && tokenEmail === adminEmail);

        return NextResponse.json({
            status: 'success',
            uid: decodedToken.uid,
            email: tokenEmail,
            emailVerified: decodedToken.email_verified,
            isAdmin,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function GET(request: NextRequest) {
    if (!adminAuth) {
        return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        const tokenEmail = (decodedToken.email as string | undefined)?.trim();
        const isAdmin = !!(adminEmail && tokenEmail === adminEmail);
        
        return NextResponse.json({ 
            status: 'success', 
            uid: decodedToken.uid,
            email: tokenEmail,
            emailVerified: decodedToken.email_verified,
            isAdmin,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
