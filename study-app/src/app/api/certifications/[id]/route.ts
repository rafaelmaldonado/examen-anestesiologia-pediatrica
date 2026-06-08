import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedAdmin } from "@/lib/firebase/auth-helper";
import { deleteCollection } from "@/lib/firebase/firestore-helpers";

// GET a single certification
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docRef = getAdminDb().collection("certifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
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
    const { id } = await params;
    const body = await request.json();
    const { name, description, isAdobe, price, isFree, isActive, examDurationMinutes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await getAdminDb().collection("certifications").doc(id).update({
      name,
      description,
      isAdobe,
      price: price || 0,
      isFree: isFree || false,
      isActive: isActive !== false,
      examDurationMinutes: examDurationMinutes || 30,
    });

    return NextResponse.json({ id, name, description, isAdobe, price, isFree, isActive, examDurationMinutes });
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
    const { id } = await params;

    await deleteCollection(`certifications/${id}/questions`);
    await getAdminDb().collection("certifications").doc(id).delete();

    return NextResponse.json({ message: "Certification and all its questions deleted successfully" });
  } catch (error) {
    const { id } = await params;
    console.error(`Error deleting certification ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
