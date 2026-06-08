import * as admin from 'firebase-admin';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Option 1: individual env vars (recommended for Vercel)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (clientEmail && rawPrivateKey && projectId) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Option 2: full JSON blob
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (serviceAccountString) {
    try {
      const sa = JSON.parse(serviceAccountString.trim());
      if (typeof sa.private_key === 'string') {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      return admin.initializeApp({ credential: admin.credential.cert(sa) });
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON:', e);
    }
  }

  throw new Error(
    '[Firebase Admin] No credentials found. Add FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY ' +
    'to your Vercel environment variables.'
  );
}

// Lazy getters — do NOT call admin.auth() / admin.firestore() at module load time
// because this file is imported during Next.js build when no credentials exist.
export function getAdminAuth(): admin.auth.Auth {
  return initFirebaseAdmin().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return initFirebaseAdmin().firestore();
}

// Keep these for backward compatibility — they resolve lazily via getters
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    return (getAdminAuth() as any)[prop];
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    return (getAdminDb() as any)[prop];
  },
});
