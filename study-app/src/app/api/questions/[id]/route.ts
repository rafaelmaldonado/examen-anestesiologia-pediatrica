import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

interface Params {
  params: { id: string };
}

import { randomUUID } from "crypto";

// PUT to update a question and its options (admin only)
export async function PUT(request: Request, { params }: Params) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");
  const questionId = params.id;

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required in query parameters" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { questionText, questionOptions } = body;

    if (!questionText || !questionOptions || !Array.isArray(questionOptions) || questionOptions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedOptions = questionOptions.map((opt: any) => ({
        ...opt,
        id: opt.id || randomUUID(), // Add ID if it doesn't exist
    }));

    const docRef = adminDb.collection(`certifications/${certificationId}/questions`).doc(questionId);
    await docRef.update({
        questionText,
        options: updatedOptions,
    });

    return NextResponse.json({ id: questionId, questionText, options: updatedOptions });
  } catch (error) {
    console.error(`Error updating question ${questionId}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a question (admin only)
export async function DELETE(request: Request, { params }: Params) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");
  const questionId = params.id;

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required in query parameters" }, { status: 400 });
  }

  try {
    await adminDb.collection(`certifications/${certificationId}/questions`).doc(questionId).delete();
    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error(`Error deleting question ${questionId}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
