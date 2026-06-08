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

// This route is called by the client to create a session cookie after successful login.
export async function POST(request: NextRequest) {
  try {
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

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
  } catch (error: any) {
    console.error("Session login error:", error);
    // Return the actual error message in development, and a safe message in production.
    // The real message is visible in Vercel Function logs.
    const message = process.env.NODE_ENV === 'development'
      ? (error?.message || String(error))
      : 'Error al crear la sesión. Revisa los logs de Vercel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// This route is called to sign out and clear the session cookie.
export async function DELETE() {
  try {
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const options = {
        name: "session",
        value: "",
        maxAge: -1,
    };
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set(options);
    return response;
  } catch (error) {
    console.error("Session logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
