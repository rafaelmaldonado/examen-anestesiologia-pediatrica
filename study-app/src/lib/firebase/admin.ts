import * as admin from 'firebase-admin';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountString) {
  console.warn(
    '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY_JSON no está configurada. ' +
    'Las operaciones del servidor no funcionarán. ' +
    'Asegúrate de que el JSON esté en una sola línea en tu .env.local'
  );
}

let serviceAccount;
try {
  if (serviceAccountString) {
    serviceAccount = JSON.parse(serviceAccountString.trim());
  }
} catch (error) {
  console.error(
    '[Firebase Admin] Error al parsear FIREBASE_SERVICE_ACCOUNT_KEY_JSON. ' +
    'El JSON debe estar en una sola línea sin saltos de línea reales. ' +
    'Ejecuta: node scripts/fix-env.js para corregirlo. Error:', error
  );
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (!admin.apps.length && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.warn('[Firebase Admin] Inicialización mínima falló:', error);
  }
}

const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

export { adminAuth, adminDb };
