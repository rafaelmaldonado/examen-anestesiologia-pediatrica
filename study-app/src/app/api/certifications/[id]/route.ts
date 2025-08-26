import { NextResponse } from "next/server";
import { checkFirebaseAdmin } from "@/lib/firebase/admin-helpers";
import { getVerifiedAdmin } from "@/lib/firebase/auth-helper";
import { deleteCollection } from "@/lib/firebase/firestore-helpers";

// GET a single certification (publicly accessible)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminDb } = checkFirebaseAdmin();
    const { id } = await params;

    const docRef = adminDb.collection("certifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({ id: doc.id, ...data });
  } catch (error) {
    console.error("Error fetching certification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT to update a certification (admin only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  try {
    const { adminDb } = checkFirebaseAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, description, isAdobe } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const docRef = adminDb.collection("certifications").doc(id);
    await docRef.update({
        name,
        description,
        isAdobe,
    });

    return NextResponse.json({ id, name, description, isAdobe });
  } catch (error) {
    const { id } = await params;
    console.error(`Error updating certification ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a certification (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  try {
    const { adminDb } = checkFirebaseAdmin();
    const { id } = await params;
    const questionsPath = `certifications/${id}/questions`;

    // First, recursively delete the 'questions' subcollection
    await deleteCollection(questionsPath);

    // Then, delete the certification document itself
    await adminDb.collection("certifications").doc(id).delete();

    return NextResponse.json({ message: "Certification and all its questions deleted successfully" });
  } catch (error) {
    const { id } = await params;
    console.error(`Error deleting certification ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
