import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getVerifiedAdmin } from '@/lib/firebase/auth-helper';

export async function GET() {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    // Fetch all test results
    const snapshot = await getAdminDb()
      .collection('testResults')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail || null,
        certificationId: data.certificationId,
        certificationName: data.certificationName || data.certificationId,
        score: data.score,
        correctCount: data.correctCount ?? null,
        totalQuestions: data.totalQuestions ?? null,
        timeTaken: data.timeTaken ?? null,
        finishedAt: data.finishedAt?.toDate?.()?.toISOString() ?? data.createdAt?.toDate?.()?.toISOString() ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    // Resolve display names and emails for each result
    const resultsWithNames = await Promise.all(
      results.map(async result => {
        let displayName: string | null = null;
        try {
          const firebaseUser = await getAdminAuth().getUser(result.userId);
          displayName = firebaseUser.displayName || null;
          // Also fill email if missing
          if (!result.userEmail) {
            result.userEmail = firebaseUser.email || result.userId;
          }
        } catch {
          // user might have been deleted
        }
        return { ...result, displayName };
      })
    );

    return NextResponse.json(resultsWithNames);
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
