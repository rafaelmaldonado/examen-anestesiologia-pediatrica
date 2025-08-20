import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

// GET all certifications (publicly accessible)
export async function GET() {
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
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, isAdobe } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const docRef = await adminDb.collection("certifications").add({
      name,
      description: description || "",
      isAdobe: isAdobe || false,
    });

    return NextResponse.json({ id: docRef.id, name, description, isAdobe }, { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
