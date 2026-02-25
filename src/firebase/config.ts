//
// **Do not use this file to store configuration secrets.**
//
// This file is intended to be checked into source control and should
// not contain any sensitive information, such as API keys or database
// credentials.
//
// Instead, use environment variables to store your configuration secrets,
// and load them into your application at runtime.
//
// See https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
// for more information on how to use environment variables in a Next.js
// application.
//
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
