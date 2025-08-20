import { NextResponse, NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return NextResponse.json({ status: 'success', uid: decodedToken.uid }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
