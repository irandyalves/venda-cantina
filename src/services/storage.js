// Camada de armazenamento e sincronização (Firebase Firestore na Nuvem + Sincronizador Local de Alta Performance)

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';

const FIREBASE_CONFIG_KEY = 'cantina_firebase_config';
const LOCAL_ORDERS_KEY = 'cantina_local_orders';
const LOCAL_PRODUCTS_KEY = 'cantina_local_products';
const LOCAL_COUNTERS_KEY = 'cantina_local_counters';
const COLLECTION_ORDERS = 'cantina_pedidos';

// Configuração padrão com o banco Cloud Firestore ATIVO na conta do usuário
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAujmh1TuWRCS53zz1BZXIQvgHbXVibKwo",
  authDomain: "carga-patrimonio.firebaseapp.com",
  projectId: "carga-patrimonio",
  storageBucket: "carga-patrimonio.firebasestorage.app",
  messagingSenderId: "478068393511",
  appId: "1:478068393511:web:d61f883ee1c1506887b002"
};

// BroadcastChannel para sincronização instantânea entre abas no mesmo navegador
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('cantina_sync_channel')
  : null;

class StorageService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isFirebaseReady = false;
    this.connectionStatusListeners = [];
    this.initFirebase();
  }

  onConnectionStatusChange(callback) {
    this.connectionStatusListeners.push(callback);
    callback(this.isFirebaseReady);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(cb => cb !== callback);
    };
  }

  notifyConnectionStatus() {
    this.connectionStatusListeners.forEach(cb => cb(this.isFirebaseReady));
  }

  // Carrega configuração salva no localStorage ou padrão ativo
  getFirebaseConfig() {
    const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey) return parsed;
      } catch (e) {
        console.error('Erro ao ler configuração salva do Firebase', e);
      }
    }

    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY.length > 10) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }

    return DEFAULT_FIREBASE_CONFIG;
  }

  saveFirebaseConfig(config) {
    if (!config || !config.apiKey || !config.projectId) {
      throw new Error('Configuração inválida. É necessário ao menos apiKey e projectId.');
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    return this.initFirebase();
  }

  initFirebase() {
    const config = this.getFirebaseConfig();
    if (!config || !config.apiKey) {
      this.isFirebaseReady = false;
      this.notifyConnectionStatus();
      return false;
    }

    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(config);
      this.db = getFirestore(this.app);
      this.isFirebaseReady = true;
      this.notifyConnectionStatus();
      console.log('✅ Firebase Firestore conectado com sucesso ao projeto:', config.projectId);
      return true;
    } catch (e) {
      console.error('❌ Falha ao inicializar Firebase:', e);
      this.isFirebaseReady = false;
      this.notifyConnectionStatus();
      return false;
    }
  }

  // Gerador de código de comanda sequencial:
  // Ex: P ped-01, P int-02, Açaí 01, Bat 01
  getNextOrderNumber(prefix = 'P ped-') {
    const counters = this.getCounters();
    const current = (counters[prefix] || 0) + 1;
    counters[prefix] = current;
    localStorage.setItem(LOCAL_COUNTERS_KEY, JSON.stringify(counters));

    const formattedNum = String(current).padStart(2, '0');
    return `${prefix}${formattedNum}`;
  }

  getCounters() {
    try {
      const raw = localStorage.getItem(LOCAL_COUNTERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  resetDailyCounters() {
    localStorage.setItem(LOCAL_COUNTERS_KEY, JSON.stringify({}));
  }

  // --- PRODUTOS E CATEGORIAS ---

  getProducts() {
    try {
      const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler produtos locais:', e);
    }
    return DEFAULT_CATEGORIES;
  }

  saveProducts(categories) {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(categories));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRODUCTS_UPDATED', payload: categories });
    }
  }

  // --- PEDIDOS (EM TEMPO REAL CLOUD FIRESTORE) ---

  async createOrder(orderData) {
    const timestamp = Date.now();
    const orderId = 'ord_' + timestamp + '_' + Math.random().toString(36).substr(2, 6);
    const order = {
      ...orderData,
      id: orderId,
      createdAt: timestamp,
      status: 'em_preparo', // Chegou na cozinha já entra Em Preparação direto!
    };

    // 1. Grava no Cloud Firestore com ID explícito
    if (this.isFirebaseReady && this.db) {
      try {
        const orderRef = doc(this.db, COLLECTION_ORDERS, orderId);
        await setDoc(orderRef, {
          ...order,
          firebaseCreatedAt: serverTimestamp()
        });
        console.log('✅ Pedido gravado no Firestore em tempo real:', orderId);
      } catch (err) {
        console.error('⚠️ Falha ao salvar no Firestore:', err);
      }
    }

    // 2. Salva localmente para resposta instantânea
    const localOrders = this.getLocalOrders();
    localOrders.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localOrders));

    // 3. Notifica abas locais
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_CREATED', payload: order });
    }

    return order;
  }

  async updateOrderStatus(orderId, newStatus) {
    // newStatus pode ser: 'em_preparo', 'pronto', 'entregue', 'cancelado'
    if (this.isFirebaseReady && this.db) {
      try {
        const orderRef = doc(this.db, COLLECTION_ORDERS, orderId);
        await setDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('✅ Status atualizado no Firestore para:', newStatus, orderId);
      } catch (err) {
        console.error('⚠️ Erro ao atualizar status no Firestore:', err);
      }
    }

    const localOrders = this.getLocalOrders();
    const updated = localOrders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus, updatedAt: Date.now() };
      }
      return ord;
    });

    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_STATUS_CHANGED', payload: { orderId, newStatus } });
    }

    return updated;
  }

  getLocalOrders() {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Inscrição em tempo real para as telas (Caixa, Cozinha e TV)
  subscribeOrders(callback) {
    let unsubscribeFirestore = null;

    if (this.isFirebaseReady && this.db) {
      try {
        const q = query(collection(this.db, COLLECTION_ORDERS), orderBy('createdAt', 'desc'));
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          console.log(`📡 Firestore Realtime: ${list.length} pedidos recebidos`);
          // Atualiza o cache local
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
          callback(list);
        }, (error) => {
          console.error('❌ Erro no onSnapshot do Firestore:', error);
          callback(this.getLocalOrders());
        });
      } catch (e) {
        console.error('❌ Erro ao assinar Firestore:', e);
        callback(this.getLocalOrders());
      }
    } else {
      // Se não conectou no Firestore, emite estado local
      callback(this.getLocalOrders());
    }

    // Escuta sincronizações locais entre abas
    const onMessage = (event) => {
      if (event.data?.type?.startsWith('ORDER_')) {
        callback(this.getLocalOrders());
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onMessage);
    }

    // Escuta eventos de storage caso seja em janelas separadas
    const onStorage = (e) => {
      if (e.key === LOCAL_ORDERS_KEY) {
        callback(this.getLocalOrders());
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (syncChannel) syncChannel.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }

  // Limpar pedidos do dia
  clearDayOrders() {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([]));
    this.resetDailyCounters();
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDERS_CLEARED' });
    }
  }
}

export const storageService = new StorageService();
