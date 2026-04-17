import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCYUITlJf5SmNjmtitoc6TWekBo8Bez6ik',
  authDomain: 'kinderadmin-95191.firebaseapp.com',
  projectId: 'kinderadmin-95191',
  storageBucket: 'kinderadmin-95191.firebasestorage.app',
  messagingSenderId: '925802860610',
  appId: '1:925802860610:web:fa703c77ac3032f2879ddb',
  measurementId: 'G-P4NLFY5P6C',
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
