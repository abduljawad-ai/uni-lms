// src/firebase/config.js
// ⚠️  Replace these values with your actual Firebase project credentials
// Go to: https://console.firebase.google.com → Your Project → Project Settings → Web App

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBaB0_VifGPzCrFjQ_kiAi335b_TD8_VCE",
  authDomain: "academy-os-lms-58f72.firebaseapp.com",
  projectId: "academy-os-lms-58f72",
  storageBucket: "academy-os-lms-58f72.firebasestorage.app",
  messagingSenderId: "354198035583",
  appId: "1:354198035583:web:8448a56c3354907444334a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
