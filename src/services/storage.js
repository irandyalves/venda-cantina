// Camada de armazenamento e sincronização (Firebase Firestore + Sincronizador Local de Alta Performance)

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

// BroadcastChannel para sincronização instantânea entre abas no mesmo navegador (Zero latência)
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('cantina_sync_channel')
  : null;

class StorageService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isFirebaseReady = false;
    this.initFirebase();
  }

  // Carrega configuração salva ou de variáveis de ambiente
  getFirebaseConfig() {
    const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler configuração salva do Firebase', e);
      }
    }

    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }

    return null;
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
      return false;
    }

    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(config);
      this.db = getFirestore(this.app);
      this.isFirebaseReady = true;
      console.log('Firebase conectado com sucesso ao projeto:', config.projectId);
      return true;
    } catch (e) {
      console.error('Falha ao inicializar Firebase:', e);
      this.isFirebaseReady = false;
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

  // --- PEDIDOS (EM TEMPO REAL) ---

  async createOrder(orderData) {
    const timestamp = Date.now();
    const order = {
      ...orderData,
      id: 'ord_' + timestamp + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: timestamp,
      status: 'em_preparo', // Chegou na cozinha já entra Em Preparação direto conforme pedido!
    };

    if (this.isFirebaseReady && this.db) {
      try {
        const docRef = await addDoc(collection(this.db, 'pedidos'), {
          ...order,
          firebaseCreatedAt: serverTimestamp()
        });
        order.id = docRef.id;
      } catch (err) {
        console.warn('Erro ao salvar no Firestore, usando fallback local:', err);
      }
    }

    // Salva localmente e emite pelo canal para todas as abas
    const localOrders = this.getLocalOrders();
    localOrders.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localOrders));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_CREATED', payload: order });
    }

    return order;
  }

  async updateOrderStatus(orderId, newStatus) {
    // newStatus pode ser: 'em_preparo', 'pronto', 'entregue', 'cancelado'
    if (this.isFirebaseReady && this.db) {
      try {
        const orderRef = doc(this.db, 'pedidos', orderId);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Erro ao atualizar no Firestore, fallback local:', err);
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
    // Se o Firebase estiver ativo, escuta via onSnapshot
    let unsubscribeFirestore = null;

    if (this.isFirebaseReady && this.db) {
      try {
        const q = query(collection(this.db, 'pedidos'), orderBy('createdAt', 'desc'));
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          callback(list);
        }, (error) => {
          console.warn('Erro no onSnapshot do Firestore:', error);
          callback(this.getLocalOrders());
        });
      } catch (e) {
        console.warn('Não foi possível assinar Firestore:', e);
      }
    }

    // Dispara estado inicial
    callback(this.getLocalOrders());

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
