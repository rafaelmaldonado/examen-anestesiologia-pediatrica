import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedAdmin } from "@/lib/firebase/auth-helper";

// GET all certifications (requires auth — middleware enforces this)
export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("certifications").orderBy("name").get();
    const certifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new certification (admin only)
export async function POST(request: Request) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, isActive, examDurationMinutes, availableFrom, availableUntil } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const docRef = await getAdminDb().collection("certifications").add({
      name,
      description: description || "",
      isActive: isActive !== false,           // default true
      examDurationMinutes: examDurationMinutes || 30,
      availableFrom: availableFrom ?? null,
      availableUntil: availableUntil ?? null,
    });

    return NextResponse.json({ 
      id: docRef.id, 
      name, 
      description
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
