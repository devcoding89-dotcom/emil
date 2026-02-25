'use client';

import {
  type FirebaseApp,
  type FirebaseOptions,
  initializeApp,
  getApps,
} from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

import { firebaseConfig } from '@/firebase/config';

export { FirebaseProvider, FirebaseClientProvider, useFirebase, useFirebaseApp, useFirestore, useAuth, getFirebaseApp } from './provider';
export { useUser } from './auth/use-user';
export { useDoc } from './firestore/use-doc';
export { useCollection } from './firestore/use-collection';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

const getFirebase = () => {
  if (firebaseApp && auth && firestore) {
    return { firebaseApp, auth, firestore };
  }
  
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
  } else if (
    typeof window !== 'undefined' &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  ) {
    firebaseApp = initializeApp(firebaseConfig as FirebaseOptions);
  }

  if (firebaseApp) {
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  return { firebaseApp, auth, firestore };
};

export function initializeFirebase() {
  return getFirebase();
}
