import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuJP3imBBQZ7CWJzUhosSbyEhi_Z0lgj8",
  authDomain: "bubbsan-c3ec7.firebaseapp.com",
  projectId: "bubbsan-c3ec7",
  storageBucket: "bubbsan-c3ec7.firebasestorage.app",
  messagingSenderId: "999127046153",
  appId: "1:999127046153:web:4ddd2814db25f691d800d8",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
