import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser, getVerifiedAdmin } from "@/lib/firebase/auth-helper";

// GET all certifications (publicly accessible)
export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection("certifications").orderBy("name").get();
    const certifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new certification (admin only)
export async function POST(request: Request) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, isAdobe, price, isFree, isActive, examDurationMinutes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const docRef = await adminDb.collection("certifications").add({
      name,
      description: description || "",
      isAdobe: isAdobe || false,
      price: price || 0,
      isFree: isFree !== false,
      isActive: isActive !== false,           // default true
      examDurationMinutes: examDurationMinutes || 30,
    });

    return NextResponse.json({ 
      id: docRef.id, 
      name, 
      description, 
      isAdobe, 
      price, 
      isFree 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
