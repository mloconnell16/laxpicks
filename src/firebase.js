import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbwhcw9q7ee1YFaYpHoSDhk9yxMiKQ81g",
  authDomain: "laxpicks-68be4.firebaseapp.com",
  projectId: "laxpicks-68be4",
  storageBucket: "laxpicks-68be4.firebasestorage.app",
  messagingSenderId: "1023828661470",
  appId: "1:1023828661470:web:653f1b75aa54be4782de4f",
  measurementId: "G-DFF9JFNTXG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);