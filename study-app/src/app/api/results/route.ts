import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import * as admin from 'firebase-admin';

interface UserAnswer {
  questionId: string; // Firestore IDs are strings
  selectedOptionId: string;
}

// POST to submit quiz results and get the score
export async function POST(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.uid;

  try {
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { certificationId, answers } = body as { certificationId: string, answers: UserAnswer[] };

    if (!certificationId || !answers || !Array.isArray(answers) || answers.length === 0) {
      console.error('Missing required fields:', { certificationId, answers });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionIds = answers.map(a => a.questionId);

    // Debug logging
    console.log('questionIds:', questionIds);
    console.log('certificationId:', certificationId);

    // Validate questionIds
    if (questionIds.some(id => !id)) {
      console.error('Some question IDs are undefined or empty:', questionIds);
      return NextResponse.json({ error: "Invalid question IDs" }, { status: 400 });
    }

    // Fetch the questions the user answered
    const questionsRef = adminDb.collection(`certifications/${certificationId}/questions`);
    const questionsSnapshot = await questionsRef.where(admin.firestore.FieldPath.documentId(), 'in', questionIds).get();
    const correctQuestionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    let correctCount = 0;
    const resultsWithExplanations = answers.map(userAnswer => {
      const question = correctQuestionsData.find(q => q.id === userAnswer.questionId);
      if (!question) {
        console.log(`Question not found for ID: ${userAnswer.questionId}`);
        return null;
      }

      const correctOption = question.options?.find((opt: any) => opt.isCorrect);
      const isUserCorrect = correctOption?.id === userAnswer.selectedOptionId;
      if (isUserCorrect) {
        correctCount++;
      }

      return {
        questionId: userAnswer.questionId,
        questionText: question.questionText || 'Question text not found',
        selectedOptionId: userAnswer.selectedOptionId,
        correctOption: correctOption,
        allOptions: question.options || [],
        isCorrect: isUserCorrect,
      };
    }).filter(Boolean);

    const score = Math.round((correctCount / answers.length) * 100);

    // Save the result to the database
    await adminDb.collection("testResults").add({
      userId,
      certificationId,
      score,
      createdAt: new Date(),
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
