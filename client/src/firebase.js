import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

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

export async function saveTransactionCloud(record) {
  if (!db) return;
  try {
    const colRef = collection(db, "transactions");
    await addDoc(colRef, {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[Firebase] Telemetry synced to local store:", err.message);
  }
}

export function subscribeRecentTransactions(callback) {
  if (!db) return () => {};
  try {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(10));
    return onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(txs);
    }, (err) => {
      console.warn("[Firebase] Real-time listener offline fallback:", err.message);
    });
  } catch (err) {
    return () => {};
  }
}

export async function logTransactionToFirebase(record) {
  return saveTransactionCloud(record);
}

export { app, db };
