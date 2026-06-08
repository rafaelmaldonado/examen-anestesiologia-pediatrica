import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

export async function GET(request: Request) {
  // Authentication required
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");
  const countStr = searchParams.get("count") || "20";
  const count = parseInt(countStr, 10);

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId es requerido" }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 });
  }

  try {
    // Fetch certification to check isActive and examDurationMinutes
    const certDoc = await adminDb.collection("certifications").doc(certificationId).get();
    if (!certDoc.exists) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }
    const certData = certDoc.data()!;

    // Check if exam is active
    if (certData.isActive === false) {
      return NextResponse.json(
        { error: "Este examen no está disponible en este momento." },
        { status: 403 }
      );
    }

    // Check one-attempt rule: does user already have a result for this certification?
    const existingResult = await adminDb
      .collection("testResults")
      .where("userId", "==", user.uid)
      .where("certificationId", "==", certificationId)
      .limit(1)
      .get();

    if (!existingResult.empty) {
      return NextResponse.json(
        { error: "Ya completaste este examen. Solo se permite un intento por estudiante." },
        { status: 409 }
      );
    }

    const questionsRef = adminDb.collection(`certifications/${certificationId}/questions`);
    const snapshot = await questionsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "No hay preguntas disponibles para este examen." }, { status: 404 });
    }

    const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const randomQuestions = allQuestions.slice(0, count);

    const questionsForQuiz = randomQuestions.map((q: any) => {
      const optionsForQuiz = q.options?.map((opt: any) => ({
        id: opt.id,
        optionText: opt.optionText,
      })) || [];

      return {
        id: q.id,
        questionText: q.questionText,
        isMultiSelect: q.isMultiSelect || false,
        options: optionsForQuiz.sort(() => Math.random() - 0.5),
      };
    });

    return NextResponse.json({
      questions: questionsForQuiz,
      examDurationMinutes: certData.examDurationMinutes ?? 30,
      certificationName: certData.name || '',
    });
  } catch (error) {
    console.error("Error al cargar preguntas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
