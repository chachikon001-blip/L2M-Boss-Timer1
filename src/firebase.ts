import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBVldycvXgRGoK11FZptaxueaQYuMaoUg0",
  authDomain: "l2m-boss-timer-f5657.firebaseapp.com",
  projectId: "l2m-boss-timer-f5657",
  storageBucket: "l2m-boss-timer-f5657.appspot.com",
  messagingSenderId: "300942256586",
  appId: "1:300942256586:web:162cd7e840ef4c82c34733",
  measurementId: "G-J6C1ZWV1LB"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
