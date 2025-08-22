import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import { deleteCollection } from "@/lib/firebase/firestore-helpers";

// PUT to update a certification (admin only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
