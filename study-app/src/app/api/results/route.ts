import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedUser, isAdminEmail } from "@/lib/firebase/auth-helper";
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
      timeTaken?: number,
      isTestAttempt?: boolean,
    };

    const canMarkAsTest = isAdminEmail(user.email as string | undefined);
    const finalIsTestAttempt = canMarkAsTest && Boolean(body?.isTestAttempt);

    if (!certificationId) {
      return NextResponse.json({ error: "certificationId es requerido" }, { status: 400 });
    }

    // answers can be empty if time ran out before any answer was given
    const safeAnswers: UserAnswer[] = Array.isArray(answers) ? answers : [];

    const questionIds = safeAnswers.map(a => a.questionId).filter(Boolean);

    // Prevent duplicate submissions only for real attempts.
    // Admin test attempts are intentionally allowed multiple times.
    if (!finalIsTestAttempt) {
      const existingResult = await getAdminDb()
        .collection("testResults")
        .where("userId", "==", userId)
        .where("certificationId", "==", certificationId)
        .limit(20)
        .get();

      const hasRealAttempt = existingResult.docs.some(doc => doc.data().isTestAttempt !== true);
      if (hasRealAttempt) {
        return NextResponse.json(
          { error: "Ya enviaste los resultados de este examen. Solo se permite un intento." },
          { status: 409 }
        );
      }
    }

    let correctCount = 0;

    // Score on the server only. We intentionally do NOT build or return any
    // per-question detail (correct options, explanations, the answer key) — that
    // data must never reach the browser, otherwise students could read it from
    // the Network tab and share the answers. Only the aggregate score leaves
    // the server.
    if (questionIds.length > 0) {
      const questionsSnapshot = await getAdminDb()
        .collection(`certifications/${certificationId}/questions`)
        .where(admin.firestore.FieldPath.documentId(), 'in', questionIds)
        .get();
      const correctQuestionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      for (const userAnswer of safeAnswers) {
        const question = correctQuestionsData.find(q => q.id === userAnswer.questionId);
        if (!question) continue;

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
      }
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
      isTestAttempt: finalIsTestAttempt,
      score,
      correctCount,
      totalQuestions,
      timeTaken: timeTaken ?? null,
      finishedAt,
      createdAt: finishedAt,
    });

    // Return ONLY the aggregate score. No per-question detail, no answer key,
    // no explanations — keeping the correct answers server-side prevents
    // students from extracting and sharing them.
    return NextResponse.json({
      score,
      correctCount,
      totalQuestions,
      certificationId,
      certificationName,
      isTestAttempt: finalIsTestAttempt,
      timeTaken,
      finishedAt: finishedAt.toISOString(),
    });

  } catch (error) {
    console.error("Error al guardar resultados:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
