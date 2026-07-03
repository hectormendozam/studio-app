import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { app } from './firebase-init.js';

export const auth = app ? getAuth(app) : null;

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase Auth no esta configurado.');
  }
}

export function isAuthReady() {
  return Boolean(auth);
}

export function subscribeToClientAuth(callback) {
  requireAuth();
  return onAuthStateChanged(auth, callback);
}

export async function registerClient(email, password) {
  requireAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function loginClient(email, password) {
  requireAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutClient() {
  requireAuth();
  await signOut(auth);
}
