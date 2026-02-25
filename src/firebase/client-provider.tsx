'use client';

import { useMemo, type PropsWithChildren } from 'react';

import { initializeFirebase, FirebaseProvider } from './index';

export const FirebaseClientProvider = ({
  children,
}: PropsWithChildren<unknown>) => {
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
};
