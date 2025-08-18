import { NextResponse } from "next/server";
import { db } from "@/db";
import { certifications } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET all certifications (publicly accessible)
export async function GET() {
  try {
    const allCertifications = await db.query.certifications.findMany();
    return NextResponse.json(allCertifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new certification (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, isAdobe } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newCertification = await db
      .insert(certifications)
      .values({
        name,
        description,
        isAdobe,
      })
      .returning();

    return NextResponse.json(newCertification[0], { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
