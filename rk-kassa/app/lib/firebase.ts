import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, doc, getFirestore } from "firebase/firestore";

// Firebase web configuration is intentionally public. Access is protected by
// Firebase Authentication and Firestore security rules, not by these values.
const firebaseConfig = {
  apiKey: "AIzaSyCKeSgETR8ELP39fDpMt5mZzYcJSn_UFII",
  authDomain: "rk-kassa.firebaseapp.com",
  projectId: "rk-kassa",
  storageBucket: "rk-kassa.firebasestorage.app",
  messagingSenderId: "905975260599",
  appId: "1:905975260599:web:d63c6bf70985b3f0c37432",
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const kassaStateRef = doc(firestore, "rk-kassa", "shared-state");
export const categoryStateRef = doc(firestore, "rk-kassa", "categories");
// Sales live one-per-document. A busy sales day can therefore never make one
// shared document too large or overwrite another completed purchase.
export const salesCollectionRef = collection(firestore, "kassa-sales");
export const cashierStateRef = doc(firestore, "rk-kassa", "cashiers");
