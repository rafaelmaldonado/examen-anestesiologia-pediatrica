import * as admin from 'firebase-admin';

function initFirebaseAdmin(): admin.app.App {
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
      throw new Error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON: ' + e);
    }
  }

  throw new Error(
    '[Firebase Admin] No credentials found. Add FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY ' +
    'to your Vercel environment variables.'
  );
}

// Lazy getters — only invoked at request time, never during Next.js build
export function getAdminAuth(): admin.auth.Auth {
  return initFirebaseAdmin().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return initFirebaseAdmin().firestore();
}
