import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://l2m-boss-timer-f5657-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "l2m-boss-timer-f5657",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);