import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

// GET all questions for a specific certification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }

  try {
    if (adminDb) {
      const snapshot = await adminDb.collection(`certifications/${certificationId}/questions`).get();
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(questions);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { randomUUID } from "crypto";

// POST a new question with its options (admin only)
export async function POST(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { certificationId, questionText, isMultiSelect, questionOptions } = body;

    if (!certificationId || !questionText || !questionOptions || !Array.isArray(questionOptions) || questionOptions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newQuestionData = {
        questionText,
        isMultiSelect: isMultiSelect || false,
        options: questionOptions.map((opt: any) => ({
            ...opt,
            id: randomUUID(), // Add a unique ID to each option
        })),
    };

    if (adminDb) {
      const docRef = await adminDb.collection(`certifications/${certificationId}/questions`).add(newQuestionData);
      return NextResponse.json({ id: docRef.id, ...newQuestionData }, { status: 201 });
    }

    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });

  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
