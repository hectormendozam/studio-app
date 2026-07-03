import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { app } from './firebase-init.js';

const PRODUCTOS_COLLECTION = 'productos';
const PEDIDOS_COLLECTION = 'pedidos';
const CLIENTES_COLLECTION = 'clientes';

export const db = app ? getFirestore(app) : null;
const productsCol = db ? collection(db, PRODUCTOS_COLLECTION) : null;
const ordersCol = db ? collection(db, PEDIDOS_COLLECTION) : null;

function requireDatabase() {
  if (!db) {
    throw new Error('Firebase no esta configurado. Revisa www/firebase-init.js.');
  }
}

function mapSnapshotDocuments(snapshot) {
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data()
  }));
}

export function isDatabaseReady() {
  return Boolean(db);
}

export function getServerTimestamp() {
  return serverTimestamp();
}

// 1. Crear (anadir un producto del estudio fotografico)
export async function createProduct(productData) {
  requireDatabase();
  const docRef = await addDoc(productsCol, productData);
  return docRef.id;
}

// 2. Leer en tiempo real (ideal para mantener actualizado el catalogo)
export function subscribeToProducts(callback, onError) {
  requireDatabase();
  return onSnapshot(productsCol, (snapshot) => {
    callback(mapSnapshotDocuments(snapshot));
  }, onError);
}

export async function getProductsOnce() {
  requireDatabase();
  const snapshot = await getDocs(productsCol);
  return mapSnapshotDocuments(snapshot);
}

// 3. Actualizar (modificar stock, precio o detalles)
export async function updateProduct(productId, updatedData) {
  requireDatabase();
  const productRef = doc(db, PRODUCTOS_COLLECTION, productId);
  await updateDoc(productRef, updatedData);
}

// 4. Eliminar
export async function deleteProduct(productId) {
  requireDatabase();
  const productRef = doc(db, PRODUCTOS_COLLECTION, productId);
  await deleteDoc(productRef);
}

export async function createOrder(orderData) {
  requireDatabase();
  const docRef = await addDoc(ordersCol, orderData);
  return docRef.id;
}

export async function createOrderAndUpdateStock(orderData) {
  requireDatabase();

  return runTransaction(db, async (transaction) => {
    const stockRequests = new Map();

    orderData.items.forEach((item) => {
      const cantidad = Number(item.cantidad);

      if (!item.productoId) {
        throw new Error('El pedido contiene un producto sin identificador.');
      }

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad invalida para ${item.nombre}.`);
      }

      const existingRequest = stockRequests.get(item.productoId) || {
        cantidad: 0,
        nombre: item.nombre
      };
      existingRequest.cantidad += cantidad;
      stockRequests.set(item.productoId, existingRequest);
    });

    const stockEntries = Array.from(stockRequests.entries());
    const productRefs = stockEntries.map(([productId]) => doc(db, PRODUCTOS_COLLECTION, productId));
    const productSnapshots = [];

    for (const productRef of productRefs) {
      productSnapshots.push(await transaction.get(productRef));
    }

    stockEntries.forEach(([productId, request], index) => {
      const snapshot = productSnapshots[index];

      if (!snapshot.exists()) {
        throw new Error(`Producto no encontrado: ${request.nombre || productId}`);
      }

      const stockActual = Number(snapshot.data().stock || 0);
      const stockDisponible = Number.isFinite(stockActual) ? stockActual : 0;

      if (stockDisponible < request.cantidad) {
        throw new Error(`Stock insuficiente para ${request.nombre}. Disponible: ${stockDisponible}.`);
      }
    });

    stockEntries.forEach(([, request], index) => {
      const stockActual = Number(productSnapshots[index].data().stock || 0);
      transaction.update(productRefs[index], {
        stock: stockActual - request.cantidad,
        actualizadoEn: serverTimestamp()
      });
    });

    const orderRef = doc(ordersCol);
    transaction.set(orderRef, orderData);
    return orderRef.id;
  });
}

export async function saveClientProfile(clientId, profileData) {
  requireDatabase();
  const clientRef = doc(db, CLIENTES_COLLECTION, clientId);
  await setDoc(clientRef, {
    ...profileData,
    actualizadoEn: serverTimestamp()
  }, { merge: true });
}

export async function getClientProfile(clientId) {
  requireDatabase();
  const clientRef = doc(db, CLIENTES_COLLECTION, clientId);
  const snapshot = await getDoc(clientRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
