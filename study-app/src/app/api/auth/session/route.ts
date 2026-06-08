import { NextResponse, NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

// This route is called by the client to create a session cookie after successful login.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error("Session login error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set({ name: "session", value: "", maxAge: -1, path: '/' });
    return response;
  } catch (error: any) {
    console.error("Session logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
