import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaLYbJKeqgUE89dKPmFAyQJIk_X8tCqJk",
  authDomain: "jnisis.firebaseapp.com",
  projectId: "jnisis",
  storageBucket: "jnisis.firebasestorage.app",
  messagingSenderId: "597624905955",
  appId: "1:597624905955:web:94cba5f2a423f3875da5d6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
