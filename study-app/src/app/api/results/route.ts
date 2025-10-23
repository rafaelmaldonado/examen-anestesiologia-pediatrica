import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import { recordQuizAttempt } from "@/lib/stripe/helpers";
import * as admin from 'firebase-admin';

interface UserAnswer {
  questionId: string; // Firestore IDs are strings
  selectedOptionId: string[]; // Changed to array to support multi-select
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
    
    const { certificationId, answers, isFreeAttempt = false } = body as { 
      certificationId: string, 
      answers: UserAnswer[],
      isFreeAttempt?: boolean 
    };

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

    if (!adminDb) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
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

      const correctOptions = question.options?.filter((opt: any) => opt.isCorrect) || [];
      const correctOptionIds: string[] = correctOptions.map((opt: any) => opt.id);
      
      let isUserCorrect = false;
      
      if (question.isMultiSelect) {
        // For multi-select: user must select ALL correct options and NO incorrect ones
        const userSelectedIds = userAnswer.selectedOptionId;
        const hasAllCorrect = correctOptionIds.every((id: string) => userSelectedIds.includes(id));
        const hasNoIncorrect = userSelectedIds.every((id: string) => correctOptionIds.includes(id));
        isUserCorrect = hasAllCorrect && hasNoIncorrect && correctOptionIds.length > 0;
      } else {
        // For single-select: user must select the one correct option
        const correctOption = correctOptions[0];
        isUserCorrect = correctOption && userAnswer.selectedOptionId.includes(correctOption.id);
      }
      
      if (isUserCorrect) {
        correctCount++;
      }

      return {
        questionId: userAnswer.questionId,
        questionText: question.questionText || 'Question text not found',
        selectedOptionId: userAnswer.selectedOptionId,
        correctOptions: correctOptions,
        allOptions: question.options || [],
        isCorrect: isUserCorrect,
        isMultiSelect: question.isMultiSelect || false,
      };
    }).filter(Boolean);

    const score = Math.round((correctCount / answers.length) * 100);

    // Fetch certification details
    let certificationName = '';
    try {
      const certificationSnapshot = await adminDb.collection("certifications").doc(certificationId).get();
      if (certificationSnapshot.exists) {
        const certificationData = certificationSnapshot.data();
        certificationName = certificationData?.name || '';
      }
    } catch (error) {
      console.error('Error fetching certification details:', error);
    }

    // Save the result to the database
    if (adminDb) {
      await adminDb.collection("testResults").add({
        userId,
        certificationId,
        score,
        createdAt: new Date(),
      });
    }

    // Record the quiz attempt for payment tracking
    try {
      await recordQuizAttempt(userId, certificationId, isFreeAttempt);
    } catch (attemptError) {
      console.error('Error recording quiz attempt:', attemptError);
      // Don't fail the whole request if this fails
    }

    return NextResponse.json({
      score,
      results: resultsWithExplanations,
      certificationId,
      certificationName,
    });

  } catch (error) {
    console.error("Error submitting results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
