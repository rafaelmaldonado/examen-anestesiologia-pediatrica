import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import * as admin from 'firebase-admin';

interface UserAnswer {
  questionId: string;
  selectedOptionId: string[];
}

// POST to submit quiz results and get the score
export async function POST(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const userId = user.uid;

  try {
    const body = await request.json();

    const { certificationId, answers, timeTaken } = body as {
      certificationId: string,
      answers: UserAnswer[],
      timeTaken?: number
    };

    if (!certificationId) {
      return NextResponse.json({ error: "certificationId es requerido" }, { status: 400 });
    }

    // answers can be empty if time ran out before any answer was given
    const safeAnswers: UserAnswer[] = Array.isArray(answers) ? answers : [];

    const questionIds = safeAnswers.map(a => a.questionId).filter(Boolean);

    // Prevent duplicate submissions: check if result already exists
    const existingResult = await getAdminDb()
      .collection("testResults")
      .where("userId", "==", userId)
      .where("certificationId", "==", certificationId)
      .limit(1)
      .get();

    if (!existingResult.empty) {
      return NextResponse.json(
        { error: "Ya enviaste los resultados de este examen. Solo se permite un intento." },
        { status: 409 }
      );
    }

    let correctCount = 0;
    let resultsWithExplanations: any[] = [];

    // Only fetch/score questions if there are answers
    if (questionIds.length > 0) {
      const questionsSnapshot = await getAdminDb()
        .collection(`certifications/${certificationId}/questions`)
        .where(admin.firestore.FieldPath.documentId(), 'in', questionIds)
        .get();
      const correctQuestionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      resultsWithExplanations = safeAnswers.map(userAnswer => {
        const question = correctQuestionsData.find(q => q.id === userAnswer.questionId);
        if (!question) return null;

        const correctOptions = question.options?.filter((opt: any) => opt.isCorrect) || [];
        const correctOptionIds: string[] = correctOptions.map((opt: any) => opt.id);

        let isUserCorrect = false;
        if (question.isMultiSelect) {
          const userSelectedIds = userAnswer.selectedOptionId;
          const hasAllCorrect = correctOptionIds.every((id: string) => userSelectedIds.includes(id));
          const hasNoIncorrect = userSelectedIds.every((id: string) => correctOptionIds.includes(id));
          isUserCorrect = hasAllCorrect && hasNoIncorrect && correctOptionIds.length > 0;
        } else {
          const correctOption = correctOptions[0];
          isUserCorrect = correctOption && userAnswer.selectedOptionId.includes(correctOption.id);
        }
        if (isUserCorrect) correctCount++;

        return {
          questionId: userAnswer.questionId,
          questionText: question.questionText || 'Pregunta no encontrada',
          selectedOptionId: userAnswer.selectedOptionId,
          correctOptions,
          allOptions: question.options || [],
          isCorrect: isUserCorrect,
          isMultiSelect: question.isMultiSelect || false,
        };
      }).filter(Boolean);
    }

    const totalQuestions = safeAnswers.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const finishedAt = new Date();

    // Fetch certification details
    let certificationName = '';
    try {
      const certDoc = await getAdminDb().collection("certifications").doc(certificationId).get();
      if (certDoc.exists) certificationName = certDoc.data()?.name || '';
    } catch {}

    // Save result to Firestore
    await getAdminDb().collection("testResults").add({
      userId,
      userEmail: user.email || null,
      certificationId,
      certificationName,
      score,
      correctCount,
      totalQuestions,
      timeTaken: timeTaken ?? null,
      finishedAt,
      createdAt: finishedAt,
    });

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions,
      results: resultsWithExplanations,
      certificationId,
      certificationName,
      timeTaken,
      finishedAt: finishedAt.toISOString(),
    });

  } catch (error) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
