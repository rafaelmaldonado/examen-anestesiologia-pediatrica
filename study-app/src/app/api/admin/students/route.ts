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

    // Use a single-field query (no composite index needed) and filter test
    // attempts in memory. This matches the GET logic, which treats any row
    // where isTestAttempt !== false as a test attempt — including legacy rows
    // that predate the field. A composite where() would silently fail without
    // an index and skip those legacy rows.
    const query = certificationId
      ? getAdminDb().collection('testResults').where('certificationId', '==', certificationId).limit(1000)
      : getAdminDb().collection('testResults').limit(1000);

    const snapshot = await query.get();

    const testDocs = snapshot.docs.filter(doc => doc.data().isTestAttempt !== false);

    if (testDocs.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Firestore batches are capped at 500 writes — chunk to be safe.
    for (let i = 0; i < testDocs.length; i += 500) {
      const batch = getAdminDb().batch();
      testDocs.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    return NextResponse.json({ deleted: testDocs.length });
  } catch (error) {
    console.error('Error deleting test attempts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
