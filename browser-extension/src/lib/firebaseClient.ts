import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import config from '@/config';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

function ensureApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length) {
    firebaseApp = getApps()[0]!;
  } else {
    firebaseApp = initializeApp(config.firebase);
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  firebaseAuth = getAuth(ensureApp());
  return firebaseAuth;
}

export function getFirebaseActionCodeSettings() {
  if (typeof chrome !== 'undefined' && chrome.identity?.getRedirectURL) {
    return {
      url: chrome.identity.getRedirectURL('firebase-email-link'),
      handleCodeInApp: true,
    };
  }

  return (
    config.firebase.actionCodeSettings ?? {
      url: window.location.origin,
      handleCodeInApp: true,
    }
  );
}
