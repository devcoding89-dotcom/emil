'use client';

import {
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export async function signUp(auth: Auth, data: any) {
  const { email, password, displayName } = data;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  const db = getFirestore(auth.app);
  await setDoc(doc(db, 'users', user.uid), {
    displayName,
    email,
  });

  return user;
}

export async function signIn(auth: Auth, data: any) {
  const { email, password } = data;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle(auth: Auth) {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  const db = getFirestore(auth.app);
  await setDoc(doc(db, 'users', user.uid), {
    displayName: user.displayName,
    email: user.email,
  }, { merge: true });

  return user;
}

export async function signOut(auth: Auth) {
  await firebaseSignOut(auth);
}

export async function resetPassword(auth: Auth, email: string) {
  await sendPasswordResetEmail(auth, email);
}
