import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, options } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

// GET all questions for a specific certification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificationIdStr = searchParams.get("certificationId");

  if (!certificationIdStr) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }
  const certificationId = parseInt(certificationIdStr, 10);

  try {
    const questionsForCert = await db.query.questions.findMany({
      where: eq(questions.certificationId, certificationId),
      with: {
        options: {
          columns: {
            id: true,
            optionText: true,
            isCorrect: true,
            explanation: true,
          }
        },
      },
    });
    return NextResponse.json(questionsForCert);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new question with its options (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { certificationId, questionText, questionOptions } = body;

    if (!certificationId || !questionText || !questionOptions || !Array.isArray(questionOptions) || questionOptions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use a transaction to ensure both the question and its options are created successfully
    const newQuestion = await db.transaction(async (tx) => {
      const [insertedQuestion] = await tx
        .insert(questions)
        .values({
          certificationId,
          questionText,
        })
        .returning();

      const optionsToInsert = questionOptions.map((opt: any) => ({
        questionId: insertedQuestion.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation,
      }));

      await tx.insert(options).values(optionsToInsert);

      // Fetch the newly created question with its options to return
      const result = await tx.query.questions.findFirst({
        where: eq(questions.id, insertedQuestion.id),
        with: {
          options: true,
        },
      });

      return result;
    });

    return NextResponse.json(newQuestion, { status: 201 });

  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
