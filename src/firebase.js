import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAvNXjtQKO4mwN9rEEyk3kUHJ7Iz8hjVs",
  authDomain: "clases-gratis-app.firebaseapp.com",
  projectId: "clases-gratis-app",
storageBucket: "clases-gratis-app.appspot.com",
  messagingSenderId: "902148131039",
  appId: "1:902148131039:web:4715888e0155baf979c16a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);