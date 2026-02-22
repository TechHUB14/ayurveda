import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcn5P_Acg_N9BnuXF2-saXfIy1z5vn4tA",
  authDomain: "trisandhyaayurveda.firebaseapp.com",
  projectId: "trisandhyaayurveda",
  storageBucket: "trisandhyaayurveda.firebasestorage.app",
  messagingSenderId: "863088070579",
  appId: "1:863088070579:web:4699a99199c8a4090505c6",
  measurementId: "G-HE9KQJK0DR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
