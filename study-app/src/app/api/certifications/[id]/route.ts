import { NextResponse } from "next/server";
import { db } from "@/db";
import { certifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface Params {
  params: { id: string };
}

// PUT to update a certification (admin only)
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { name, description, isAdobe } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedCertification = await db
      .update(certifications)
      .set({ name, description, isAdobe })
      .where(eq(certifications.id, id))
      .returning();

    if (updatedCertification.length === 0) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCertification[0]);
  } catch (error) {
    console.error(`Error updating certification ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a certification (admin only)
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);

    const deletedCertification = await db
      .delete(certifications)
      .where(eq(certifications.id, id))
      .returning();

    if (deletedCertification.length === 0) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error(`Error deleting certification ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
