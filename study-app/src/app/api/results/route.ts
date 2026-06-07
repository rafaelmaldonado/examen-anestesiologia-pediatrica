import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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

    if (!certificationId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const questionIds = answers.map(a => a.questionId);

    if (questionIds.some(id => !id)) {
      return NextResponse.json({ error: "IDs de preguntas inválidos" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 });
    }

    // Prevent duplicate submissions: check if result already exists
    const existingResult = await adminDb
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

    // Fetch the questions the user answered
    const questionsRef = adminDb.collection(`certifications/${certificationId}/questions`);
    const questionsSnapshot = await questionsRef
      .where(admin.firestore.FieldPath.documentId(), 'in', questionIds)
      .get();
    const correctQuestionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    let correctCount = 0;
    const resultsWithExplanations = answers.map(userAnswer => {
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

    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const finishedAt = new Date();

    // Fetch certification details
    let certificationName = '';
    try {
      const certDoc = await adminDb.collection("certifications").doc(certificationId).get();
      if (certDoc.exists) certificationName = certDoc.data()?.name || '';
    } catch {}

    // Save result to Firestore
    await adminDb.collection("testResults").add({
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
