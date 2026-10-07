import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, Timestamp, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Suppress known Firebase Auth internal assertion errors when popup is closed/cancelled
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || '');
    const code = reason?.code || '';
    if (
      msg.includes('INTERNAL ASSERTION FAILED') ||
      msg.includes('Pending promise was never set') ||
      msg.includes('popup-closed-by-user') ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || '';
    if (msg.includes('Pending promise was never set') || msg.includes('INTERNAL ASSERTION FAILED')) {
      event.preventDefault();
    }
  });
}

let activePopupPromise: Promise<any> | null = null;

export async function signInWithGoogleSafe(): Promise<{
  user: User | null;
  cancelled?: boolean;
  error?: string | null;
}> {
  if (activePopupPromise) {
    try {
      const res = await activePopupPromise;
      return { user: res?.user || auth.currentUser };
    } catch {
      return { user: auth.currentUser, cancelled: true };
    }
  }

  try {
    activePopupPromise = signInWithPopup(auth, googleProvider);
    const result = await activePopupPromise;
    return { user: result.user };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { user: null, cancelled: true };
    }
    if (code === 'auth/popup-blocked') {
      return { user: null, error: 'Sign-in popup was blocked by your browser. Please allow popups for this site.' };
    }
    if (message.includes('Pending promise was never set')) {
      return { user: auth.currentUser, cancelled: true };
    }
    return { user: null, error: message || 'Authentication failed' };
  } finally {
    activePopupPromise = null;
  }
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client offline warning.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
