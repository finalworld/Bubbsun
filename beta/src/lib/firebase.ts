import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

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
// Android opens Google sign-in outside the app for a moment. Some WebView/TWA
// versions close IndexedDB while the page is hidden, which made Firestore fail
// immediately after a successful sign-in. The server remains the source of
// truth, so an in-memory cache is safer here and still syncs every write.
export const db = initializeFirestore(firebaseApp, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
});
