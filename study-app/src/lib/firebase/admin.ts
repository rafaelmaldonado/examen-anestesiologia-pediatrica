import * as admin from 'firebase-admin';

function initFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Option 1: individual env vars (recommended for Vercel)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  // Vercel sometimes wraps env var values in surrounding quotes — strip them
  if (rawPrivateKey?.startsWith('"') && rawPrivateKey?.endsWith('"')) {
    rawPrivateKey = rawPrivateKey.slice(1, -1);
  }

  console.log('[Firebase Admin] clientEmail present:', !!clientEmail);
  console.log('[Firebase Admin] privateKey present:', !!rawPrivateKey, '| starts with:', rawPrivateKey?.substring(0, 27));
  console.log('[Firebase Admin] projectId:', projectId);

  if (clientEmail && rawPrivateKey && projectId) {
    // Convert literal \n sequences to real newlines (Vercel escaping)
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    console.log('[Firebase Admin] Initializing with individual env vars');
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
      console.log('[Firebase Admin] Initializing with JSON blob');
      return admin.initializeApp({ credential: admin.credential.cert(sa) });
    } catch (e) {
      throw new Error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON: ' + e);
    }
  }

  throw new Error(
    '[Firebase Admin] No credentials found. ' +
    'clientEmail=' + clientEmail + ' privateKey=' + (rawPrivateKey ? 'present' : 'MISSING') + ' projectId=' + projectId
  );
}

// Lazy getters — only invoked at request time, never during Next.js build
export function getAdminAuth(): admin.auth.Auth {
  return initFirebaseAdmin().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return initFirebaseAdmin().firestore();
}
