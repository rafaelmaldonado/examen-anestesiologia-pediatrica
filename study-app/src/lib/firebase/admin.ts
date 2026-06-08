import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountString) {
  console.warn(
    '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY_JSON no está configurada. ' +
    'Las operaciones del servidor no funcionarán.'
  );
}

let serviceAccount: admin.ServiceAccount | undefined;
try {
  if (serviceAccountString) {
    serviceAccount = JSON.parse(serviceAccountString.trim());
    // Vercel sometimes stores the private_key with literal \n instead of real newlines.
    // This silently breaks credential parsing — fix it here.
    if (serviceAccount && typeof (serviceAccount as any).private_key === 'string') {
      (serviceAccount as any).private_key = (serviceAccount as any).private_key.replace(/\\n/g, '\n');
    }
  }
} catch (error) {
  console.error('[Firebase Admin] Error al parsear FIREBASE_SERVICE_ACCOUNT_KEY_JSON:', error);
}

if (!admin.apps.length) {
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] Inicializado con service account ✓');
    } catch (error) {
      console.error('[Firebase Admin] Falló la inicialización con service account:', error);
    }
  } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.warn('[Firebase Admin] Inicializado en modo mínimo — sin service account');
    } catch (error) {
      console.warn('[Firebase Admin] Inicialización mínima falló:', error);
    }
  }
}

const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export { adminAuth, adminDb };
