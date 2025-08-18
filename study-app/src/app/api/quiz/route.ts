import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, options } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

// GET a random set of questions for a quiz
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificationIdStr = searchParams.get("certificationId");
  const countStr = searchParams.get("count") || "10"; // Default to 10 questions

  if (!certificationIdStr) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }

  const certificationId = parseInt(certificationIdStr, 10);
  const count = parseInt(countStr, 10);

  try {
    const quizQuestions = await db.query.questions.findMany({
        where: eq(questions.certificationId, certificationId),
        orderBy: sql`RANDOM()`,
        limit: count,
        with: {
            options: {
                columns: {
                    id: true,
                    optionText: true,
                    // IMPORTANT: DO NOT SEND isCorrect or explanation to the client during the quiz
                }
            }
        }
    });

    // Shuffle options for each question
    quizQuestions.forEach(q => {
        q.options.sort(() => Math.random() - 0.5);
    });


    return NextResponse.json(quizQuestions);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
