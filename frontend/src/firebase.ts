import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth, browserSessionPersistence, setPersistence, signOut as firebaseSignOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  // Never blocks the app from loading — callers are responsible for handling failed
  // Firestore calls gracefully (see COPILOT_BUILD_GUIDE.md Rule 4).
  console.error(
    'Firebase config is missing. Copy frontend/.env.example to frontend/.env.local and fill in your Firebase project settings.',
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

// The Google login must never be cached between visits — every participant must sign in again on
// each visit (one account = one assessment). Session persistence keeps the auth state alive only
// for the current browser tab and clears it the moment the tab is closed. Switching persistence
// also signs out any login previously cached under the old default `local` persistence.
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error('Failed to set session-only auth persistence:', err);
});

export const signOut = firebaseSignOut;

