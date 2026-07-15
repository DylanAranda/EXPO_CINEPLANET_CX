import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

let firebaseConfig: any = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
};

// If environment variables are not found, load from the local JSON config file
if (!firebaseConfig.apiKey) {
  try {
    const localConfig = await import('../../firebase-applet-config.json', { with: { type: 'json' } }).then(m => m.default);
    firebaseConfig = localConfig;
  } catch (e) {
    console.warn("Could not load local firebase-applet-config.json, relying on Environment Variables.");
  }
}

const app = initializeApp(firebaseConfig);
console.log(`Initializing Firestore with Project ID: ${firebaseConfig.projectId} and Database ID: ${firebaseConfig.firestoreDatabaseId}`);
export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Since we're running server-side with client SDK, we might need to sign in 
// to avoid "unauthenticated" errors if rules are strict.
// However, if we use Admin SDK it would be better. 
// Given the environment, sticking to what's suggested.

export { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, serverTimestamp, Timestamp, onSnapshot };
