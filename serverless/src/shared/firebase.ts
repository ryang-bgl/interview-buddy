import { App, cert, initializeApp } from 'firebase-admin/app';
import { getConfigValue } from './config';

let cachedApp: App | null = null;

export async function getFirebaseApp(): Promise<App> {
  if (cachedApp) {
    return cachedApp;
  }

  const projectIdParam = process.env.FIREBASE_PROJECT_ID_PARAM;
  const clientEmailParam = process.env.FIREBASE_CLIENT_EMAIL_PARAM;
  const privateKeyParam = process.env.FIREBASE_PRIVATE_KEY_PARAM;

  if (!projectIdParam || !clientEmailParam || !privateKeyParam) {
    throw new Error('Firebase parameter names must be configured as environment variables');
  }

  const [projectId, clientEmail, privateKeyRaw] = await Promise.all([
    getConfigValue(projectIdParam),
    getConfigValue(clientEmailParam),
    getConfigValue(privateKeyParam),
  ]);

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  cachedApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return cachedApp;
}
