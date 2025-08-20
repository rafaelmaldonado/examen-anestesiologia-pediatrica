import { NextResponse, NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

// This route is called by the client to create a session cookie after successful login.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// This route is called to sign out and clear the session cookie.
export async function DELETE() {
    const options = {
        name: "session",
        value: "",
        maxAge: -1,
    };
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set(options);
    return response;
}
