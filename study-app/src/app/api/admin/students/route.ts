import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getVerifiedAdmin } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const includeTests = request.nextUrl.searchParams.get('includeTests') === '1';
    const certificationIdFilter = request.nextUrl.searchParams.get('certificationId') || '';

    // Fetch all test results
    const snapshot = await getAdminDb()
      .collection('testResults')
      .orderBy('createdAt', 'desc')
      .limit(1000)
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
        // Legacy rows without this field are treated as test attempts for now.
        isTestAttempt: data.isTestAttempt !== false,
        finishedAt: data.finishedAt?.toDate?.()?.toISOString() ?? data.createdAt?.toDate?.()?.toISOString() ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    })
      .filter(result => !certificationIdFilter || result.certificationId === certificationIdFilter)
      .filter(result => includeTests || !result.isTestAttempt);

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

export async function DELETE(request: NextRequest) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const certificationId = (body?.certificationId as string | undefined) || '';

    const query = certificationId
      ? getAdminDb().collection('testResults').where('certificationId', '==', certificationId).where('isTestAttempt', '==', true).limit(500)
      : getAdminDb().collection('testResults').where('isTestAttempt', '==', true).limit(500);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({ deleted: 0 });
    }

    const batch = getAdminDb().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ deleted: snapshot.size });
  } catch (error) {
    console.error('Error deleting test attempts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
