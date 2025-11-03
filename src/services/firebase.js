import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcdG_9cM9yzmeMOFx-fhL4QAf9_wM3Yjo",
  authDomain: "achandymand-145da.firebaseapp.com",
  projectId: "achandymand-145da",
  storageBucket: "achandymand-145da.firebasestorage.app",
  messagingSenderId: "865306374889",
  appId: "1:865306374889:web:be1bc2500f388596de7678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;