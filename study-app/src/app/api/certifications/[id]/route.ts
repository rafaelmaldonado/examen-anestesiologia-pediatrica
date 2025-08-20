import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import { deleteCollection } from "@/lib/firebase/firestore-helpers";

interface Params {
  params: { id: string };
}

// PUT to update a certification (admin only)
export async function PUT(request: Request, { params }: Params) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
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
    console.error(`Error updating certification ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a certification (admin only)
export async function DELETE(request: Request, { params }: Params) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const questionsPath = `certifications/${id}/questions`;

    // First, recursively delete the 'questions' subcollection
    await deleteCollection(questionsPath);

    // Then, delete the certification document itself
    await adminDb.collection("certifications").doc(id).delete();

    return NextResponse.json({ message: "Certification and all its questions deleted successfully" });
  } catch (error) {
    console.error(`Error deleting certification ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
