import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';

// ============================================================
// CONFIGURACION DE FIREBASE
// Reemplaza estos valores con los datos de tu proyecto Firebase.
// Firebase Console > Project settings > Your apps > Web app.
// ============================================================
export const firebaseConfig = {
  apiKey: 'AIzaSyDIC2rapZj6FIAxglf0Q4rz4tu7BPtqi_k',
  authDomain: "photostudio-app-57851.firebaseapp.com",
  projectId: "photostudio-app-57851",
  storageBucket: "photostudio-app-57851.firebasestorage.app",
  messagingSenderId: "225917313909",
  appId: "1:225917313909:web:8857ac66023fa51d49e93c",
  measurementId: "G-X2SFXHCXSD"
};

export function isFirebaseConfigured(config = firebaseConfig) {
  const configValues = Object.values(config).join('|');
  return !configValues.includes('TU_') && config.projectId !== 'TU_PROJECT_ID';
}

export let initializationError = null;
export let app = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    initializationError = error;
    console.error('No fue posible inicializar Firebase:', error);
  }
}
