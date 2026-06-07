import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");
  const countStr = searchParams.get("count") || "20"; // Por defecto 20 preguntas
  const count = parseInt(countStr, 10);

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }

  try {
    const questionsRef = adminDb.collection(`certifications/${certificationId}/questions`);
    const snapshot = await questionsRef.get();

    if (snapshot.empty) {
        return NextResponse.json([]);
    }

    const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Fisher-Yates shuffle algorithm
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // Tomar las primeras N preguntas del shuffle
    const randomQuestions = allQuestions.slice(0, count);

    // Exclude correct answer details before sending to client
    const questionsForQuiz = randomQuestions.map((q: any) => {
        const optionsForQuiz = q.options?.map((opt: any) => ({
            id: opt.id,
            optionText: opt.optionText,
        })) || [];

        return {
            id: q.id,
            questionText: q.questionText,
            isMultiSelect: q.isMultiSelect || false, // Include the isMultiSelect field
            options: optionsForQuiz.sort(() => Math.random() - 0.5), // Shuffle options
        }
    });

    return NextResponse.json(questionsForQuiz);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
