import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getVerifiedUser } from '@/lib/firebase/auth-helper';

export async function GET() {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Only admins can access this endpoint
  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email !== adminEmail) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 500 });
  }

  try {
    // Fetch all test results
    const snapshot = await adminDb
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

    // Resolve emails for userIds that don't have email stored
    const resultsWithEmails = await Promise.all(
      results.map(async result => {
        if (result.userEmail) return result;
        try {
          if (adminAuth) {
            const firebaseUser = await adminAuth.getUser(result.userId);
            return { ...result, userEmail: firebaseUser.email || result.userId };
          }
        } catch {
          // user might have been deleted
        }
        return { ...result, userEmail: result.userId };
      })
    );

    return NextResponse.json(resultsWithEmails);
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
