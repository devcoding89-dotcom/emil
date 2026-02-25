'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: Error) => {
      // This will be caught by the Next.js error overlay
      throw error;
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, []);

  return null;
}

export default FirebaseErrorListener;
