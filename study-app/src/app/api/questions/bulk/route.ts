import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedAdmin } from "@/lib/firebase/auth-helper";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { certificationId, questions } = body;

    if (!certificationId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    const collectionRef = getAdminDb().collection(`certifications/${certificationId}/questions`);

    // Use a batched write for efficiency
    const batch = getAdminDb().batch();

    let addedCount = 0;
    for (const question of questions) {
        if (!question.questionText || !question.options || !Array.isArray(question.options)) {
            console.warn("Skipping invalid question object:", question);
            continue;
        }

        const newDocRef = collectionRef.doc(); // Create a new document reference with an auto-generated ID

        const newQuestionData = {
            questionText: question.questionText,
            isMultiSelect: question.isMultiSelect || false,
            options: question.options.map((opt: any) => ({
                id: randomUUID(),
                optionText: opt.optionText || '',
                isCorrect: opt.isCorrect || false,
                explanation: opt.explanation || '',
            })),
        };
        batch.set(newDocRef, newQuestionData);
        addedCount++;
    }

    if (addedCount === 0) {
        return NextResponse.json({ error: "No valid questions found in the provided data" }, { status: 400 });
    }

    await batch.commit();

    return NextResponse.json({ message: `${addedCount} questions added successfully.` }, { status: 201 });

  } catch (error) {
    console.error("Error bulk creating questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
