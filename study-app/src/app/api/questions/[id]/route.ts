import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, options } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface Params {
  params: { id: string };
}

// PUT to update a question and its options (admin only)
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { questionText, questionOptions } = body;

    if (!questionText || !questionOptions || !Array.isArray(questionOptions) || questionOptions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedQuestion = await db.transaction(async (tx) => {
      // Update the question text
      await tx
        .update(questions)
        .set({ questionText })
        .where(eq(questions.id, id));

      // Delete old options
      await tx.delete(options).where(eq(options.questionId, id));

      // Insert new options
      const optionsToInsert = questionOptions.map((opt: any) => ({
        questionId: id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation,
      }));

      await tx.insert(options).values(optionsToInsert);

      const result = await tx.query.questions.findFirst({
        where: eq(questions.id, id),
        with: {
            options: true
        }
      });

      return result;
    });

    if (!updatedQuestion) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error(`Error updating question ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a question (admin only)
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);

    // The 'onDelete: "cascade"' in the schema will handle deleting the options
    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning();

    if (deletedQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error(`Error deleting question ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
