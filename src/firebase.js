import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBrjxMoAhhUrJObSP4sloCuimECdDx0ew4",
  authDomain: "bot-lembrete-whatsapp.firebaseapp.com",
  projectId: "bot-lembrete-whatsapp",
  storageBucket: "bot-lembrete-whatsapp.firebasestorage.app",
  messagingSenderId: "915510240510",
  appId: "1:915510240510:web:4c01f5241e8f95bcf171af",
};

// 🚀 Inicializa o app
const app = initializeApp(firebaseConfig);

// 🔑 EXPORTS ÚNICOS (UMA VEZ SÓ)
export const auth = getAuth(app);
export const db = getFirestore(app);
