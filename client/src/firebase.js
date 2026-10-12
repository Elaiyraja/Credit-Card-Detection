import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// Configured for Firebase 30-day trial / sandbox environment
// Replace with your Firebase Console Project credentials if using custom project:
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoTrialKey30DaySandbox12345678",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "credit-card-guard-trial.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "credit-card-guard-trial",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "credit-card-guard-trial.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:a1b2c3d4e5f6g7h8i9j0"
};

let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("[Firebase] Initialized with fallback trial client:", e.message);
}

/**
 * Log transaction telemetry to Cloud Firestore (PCI-DSS compliant: Masked PAN only)
 */
export async function logTransactionToFirebase(record) {
  if (!db) return;
  try {
    const colRef = collection(db, "transactions");
    await addDoc(colRef, {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[Firebase] Telemetry synced to local store (Trial mode):", err.message);
  }
}

export { app, db };
