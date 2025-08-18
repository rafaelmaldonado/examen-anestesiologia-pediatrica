import { NextResponse } from "next/server";
import { db } from "@/db";
import { options, testResults } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { inArray, eq } from "drizzle-orm";

interface UserAnswer {
  questionId: number;
  selectedOptionId: number;
}

import { questions } from "@/db/schema";

// POST to submit quiz results and get the score
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id, 10);


  try {
    const body = await request.json();
    const { certificationId, answers } = body as { certificationId: number, answers: UserAnswer[] };

    if (!certificationId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionIds = answers.map(a => a.questionId);

    // Fetch the questions with their options
    const questionsWithOptions = await db.query.questions.findMany({
      where: inArray(questions.id, questionIds),
      with: {
        options: true,
      },
    });

    let correctCount = 0;
    const resultsWithExplanations = answers.map(userAnswer => {
      const question = questionsWithOptions.find(q => q.id === userAnswer.questionId);
      if (!question) return null;

      const correctOption = question.options.find(opt => opt.isCorrect);
      const isUserCorrect = correctOption?.id === userAnswer.selectedOptionId;
      if (isUserCorrect) {
        correctCount++;
      }

      return {
        questionId: userAnswer.questionId,
        questionText: question.questionText,
        selectedOptionId: userAnswer.selectedOptionId,
        correctOption: correctOption,
        allOptions: question.options,
        isCorrect: isUserCorrect,
      };
    }).filter(Boolean);

    const score = Math.round((correctCount / answers.length) * 100);

    // Save the result to the database
    await db.insert(testResults).values({
      userId,
      certificationId,
      score,
    });

    return NextResponse.json({
      score,
      results: resultsWithExplanations,
    });

  } catch (error) {
    console.error("Error submitting results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
