import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAh83mTA11w1UCYoWHacf0IjoT2EHX58Fw",
  authDomain: "achandymand-9b1b7.firebaseapp.com",
  projectId: "achandymand-9b1b7",
  storageBucket: "achandymand-9b1b7.firebasestorage.app",
  messagingSenderId: "572845716943",
  appId: "1:572845716943:web:3bccca159f62ee648c4eba",
  measurementId: "G-PXKM1S3PK2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
