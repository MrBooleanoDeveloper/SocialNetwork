import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAE3-Q23m9kxlJJvOMkyvmyb3V3-YvI6oc",
  authDomain: "social-network-ab36f.firebaseapp.com",
  projectId: "social-network-ab36f",
  storageBucket: "social-network-ab36f.firebasestorage.app",
  messagingSenderId: "13335604006",
  appId: "1:13335604006:web:b14c8b18972d83d044afe7",
  measurementId: "G-GSBG6GTKXQ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);