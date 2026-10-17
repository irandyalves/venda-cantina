// Camada de armazenamento e sincronização (Firebase Firestore na Nuvem + Sincronizador Local de Alta Performance)

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';

const FIREBASE_CONFIG_KEY = 'cantina_firebase_config';
const LOCAL_ORDERS_KEY = 'cantina_local_orders';
const LOCAL_PRODUCTS_KEY = 'cantina_local_products';
const LOCAL_COUNTERS_KEY = 'cantina_local_counters';
const TV_SETTINGS_KEY = 'cantina_tv_settings';
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
    
    // Central de assinantes de pedidos
    this.orderSubscribers = new Set();
    this.unsubscribeFirestore = null;
    this.pollTimer = null;
    this.lastOrdersJson = '';
    this.isReconnecting = false;

    this.initFirebase();
    this.setupLocalSync();
    this.startHeartbeatPolling();
  }

  onConnectionStatusChange(callback) {
    this.connectionStatusListeners.push(callback);
    callback(this.isFirebaseReady);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(cb => cb !== callback);
    };
  }

  notifyConnectionStatus() {
    this.connectionStatusListeners.forEach(cb => {
      try { cb(this.isFirebaseReady); } catch (e) { console.error(e); }
    });
  }

  // Carrega configuração salva no localStorage ou padrão ativo
  getFirebaseConfig() {
    const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Se o projectId for o do hosting (cantina-express-32161) que não tem o Cloud Firestore habilitado,
        // descarta e usa automaticamente o DEFAULT_FIREBASE_CONFIG (carga-patrimonio) onde o Firestore está 100% ativo!
        if (parsed && parsed.projectId && parsed.projectId !== 'cantina-express-32161' && parsed.apiKey) {
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao ler configuração salva do Firebase', e);
      }
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
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
      
      // Inicia o listener em tempo real imediatamente
      this.startFirestoreListener();
      setTimeout(() => this.purgeLegacyOrders(), 1200);
      return true;
    } catch (e) {
      console.error('❌ Falha ao inicializar Firebase:', e);
      this.isFirebaseReady = false;
      this.notifyConnectionStatus();
      return false;
    }
  }

  // --- SINCRONIZAÇÃO EM TEMPO REAL CENTRALIZADA ---

  // Inicia o listener de snapshot do Cloud Firestore
  startFirestoreListener() {
    if (!this.isFirebaseReady || !this.db) return;

    if (this.unsubscribeFirestore) {
      try { this.unsubscribeFirestore(); } catch (_) {}
      this.unsubscribeFirestore = null;
    }

    try {
      const colRef = collection(this.db, COLLECTION_ORDERS);
      this.unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ ...data, id: docSnap.id, firestoreDocId: docSnap.id });
        });
        
        // Ordena por data decrescente de forma segura em JavaScript
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        
        console.log(`📡 [Firestore Realtime] ${list.length} pedidos recebidos via WebSocket da nuvem`);
        this.notifyOrderSubscribers(list);
      }, (error) => {
        console.error('⚠️ [Firestore Realtime] Erro no onSnapshot, agendando reconexão:', error);
        if (!this.isReconnecting) {
          this.isReconnecting = true;
          setTimeout(() => {
            this.isReconnecting = false;
            this.startFirestoreListener();
          }, 2000);
        }
      });
    } catch (err) {
      console.error('❌ Erro ao configurar onSnapshot:', err);
    }
  }

  // Heartbeat Polling ativo a cada 2 segundos para garantir atualização contínua
  // (essencial para TVs e navegadores móveis que suspendem WebSockets ociosos)
  startHeartbeatPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      if (this.isFirebaseReady && this.db) {
        try {
          const colRef = collection(this.db, COLLECTION_ORDERS);
          const snap = await getDocs(colRef);
          const list = [];
          snap.forEach(docSnap => {
            const data = docSnap.data();
            list.push({ ...data, id: docSnap.id, firestoreDocId: docSnap.id });
          });
          list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

          // Compara se houve alguma alteração (novos pedidos ou status modificado)
          const currentHash = list.map(o => `${o.id}_${o.status}_${o.updatedAt || o.createdAt}`).join('|');
          if (currentHash !== this.lastOrdersHash) {
            this.lastOrdersHash = currentHash;
            console.log(`🔄 [Heartbeat Sync] Atualização detectada na nuvem (${list.length} pedidos)`);
            this.notifyOrderSubscribers(list);
          }
        } catch (err) {
          // Falha silenciosa no polling; tenta novamente no próximo ciclo
        }
      }
    }, 2000);
  }

  // Notifica todos os componentes ativos (Caixa, Cozinha, TV) instantaneamente
  notifyOrderSubscribers(orders) {
    // 1. Atualiza cache local
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));

    // 2. Dispara para todos os callbacks ativos nesta tela
    this.orderSubscribers.forEach(cb => {
      try { cb(orders); } catch (e) { console.error('Erro em subscriber de pedidos:', e); }
    });

    // 3. Emite evento interno na janela
    window.dispatchEvent(new CustomEvent('cantina_orders_internal_sync', { detail: orders }));
  }

  // Configura sincronização instantânea local (entre abas na mesma máquina)
  setupLocalSync() {
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type?.startsWith('ORDER_')) {
          const local = this.getLocalOrders();
          this.orderSubscribers.forEach(cb => {
            try { cb(local); } catch (_) {}
          });
        }
      };
    }

    // Escuta evento 'storage' para navegadores que não compartilham BroadcastChannel
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_ORDERS_KEY) {
          const local = this.getLocalOrders();
          this.orderSubscribers.forEach(cb => {
            try { cb(local); } catch (_) {}
          });
        }
      });
    }
  }

  // Assinatura de pedidos usada pelas telas: Caixa, Cozinha e TV
  subscribeOrders(callback) {
    this.orderSubscribers.add(callback);

    // Emite imediatamente o estado atual para renderização instantânea
    callback(this.getLocalOrders());

    // Se o Firestore estiver ativo, garante que o listener esteja escutando
    if (this.isFirebaseReady && !this.unsubscribeFirestore) {
      this.startFirestoreListener();
    }

    // Retorna função de cancelamento ao desmontar
    return () => {
      this.orderSubscribers.delete(callback);
    };
  }

  // Gerador de código de comanda sequencial:
  // Ex: Pp-01, Pi-02, A-01, B-01
  getNextOrderNumber(prefix = 'Pp-') {
    const cleanPrefix = (prefix || 'Pp-').trim();
    const finalPrefix = cleanPrefix.endsWith('-') || cleanPrefix.endsWith(' ') ? cleanPrefix : `${cleanPrefix}-`;
    const counters = this.getCounters();
    const current = (counters[finalPrefix] || 0) + 1;
    counters[finalPrefix] = current;
    localStorage.setItem(LOCAL_COUNTERS_KEY, JSON.stringify(counters));

    const formattedNum = String(current).padStart(2, '0');
    return `${finalPrefix}${formattedNum}`;
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
      if (raw) {
        const parsed = JSON.parse(raw);
        // Normalização de prefixos legados para o novo padrão solicitado (Pp-, Pi-, A-, B-)
        let modified = false;
        const normalized = parsed.map(cat => {
          if (cat.id === 'pizza' && cat.variations) {
            const variations = cat.variations.map(v => {
              if (v.id === 'pedaco' && (v.prefix === 'P ped-' || !v.prefix)) {
                modified = true;
                return { ...v, prefix: 'Pp-' };
              }
              if (v.id === 'inteira' && (v.prefix === 'P int-' || !v.prefix)) {
                modified = true;
                return { ...v, prefix: 'Pi-' };
              }
              return v;
            });
            return { ...cat, variations };
          }
          if (cat.id === 'acai') {
            let catPref = cat.prefixDefault;
            if (catPref === 'Açaí ' || !catPref) {
              catPref = 'A-';
              modified = true;
            }
            const items = (cat.items || []).map(it => {
              if (it.prefix === 'Açaí ' || !it.prefix) {
                modified = true;
                return { ...it, prefix: 'A-' };
              }
              return it;
            });
            return { ...cat, prefixDefault: catPref, items };
          }
          if (cat.id === 'batata') {
            let catPref = cat.prefixDefault;
            if (catPref === 'Bat ' || !catPref) {
              catPref = 'B-';
              modified = true;
            }
            const items = (cat.items || []).map(it => {
              if (it.prefix === 'Bat ' || !it.prefix) {
                modified = true;
                return { ...it, prefix: 'B-' };
              }
              return it;
            });
            return { ...cat, prefixDefault: catPref, items };
          }
          return cat;
        });

        if (modified) {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
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

  // --- CONFIGURAÇÕES DE EXIBIÇÃO DA TV ---

  getTVSettings() {
    try {
      const raw = localStorage.getItem(TV_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler configurações da TV:', e);
    }
    return {
      soundEnabled: true,
      showDelivered: true,
      autoFullscreen: false
    };
  }

  saveTVSettings(settings) {
    localStorage.setItem(TV_SETTINGS_KEY, JSON.stringify(settings));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'TV_SETTINGS_UPDATED', payload: settings });
    }
    window.dispatchEvent(new CustomEvent('cantina_tv_settings_changed', { detail: settings }));
  }

  // --- CONFIGURAÇÕES DA COZINHA (SOM E ALERTAS) ---
  getKitchenSettings() {
    try {
      const raw = localStorage.getItem('cantina_kitchen_settings');
      return raw ? JSON.parse(raw) : { soundEnabled: true };
    } catch {
      return { soundEnabled: true };
    }
  }

  saveKitchenSettings(settings) {
    localStorage.setItem('cantina_kitchen_settings', JSON.stringify(settings));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'KITCHEN_SETTINGS_UPDATED', payload: settings });
    }
    window.dispatchEvent(new CustomEvent('cantina_kitchen_settings_changed', { detail: settings }));
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

    // 1. Atualiza e notifica localmente de imediato (0ms de latência no caixa)
    const localOrders = this.getLocalOrders();
    localOrders.unshift(order);
    this.notifyOrderSubscribers(localOrders);

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_CREATED', payload: order });
    }

    // 2. Grava no Cloud Firestore na nuvem
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

    return order;
  }

  async updateOrderStatus(orderId, newStatus) {
    // newStatus pode ser: 'em_preparo', 'pronto', 'entregue', 'cancelado'
    
    // 1. Atualiza e notifica localmente de imediato (0ms de latência no clique)
    const localOrders = this.getLocalOrders();
    const orderToUpdate = localOrders.find(ord => ord.id === orderId || ord.firestoreDocId === orderId);
    const targetDocId = orderToUpdate?.firestoreDocId || orderToUpdate?.id || orderId;

    const updated = localOrders.map(ord => {
      if (ord.id === orderId || ord.id === targetDocId || ord.firestoreDocId === targetDocId) {
        return { ...ord, status: newStatus, updatedAt: Date.now() };
      }
      return ord;
    });

    this.notifyOrderSubscribers(updated);

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_STATUS_CHANGED', payload: { orderId: targetDocId, newStatus } });
    }

    // 2. Grava no Cloud Firestore na nuvem garantindo merge
    if (this.isFirebaseReady && this.db) {
      try {
        const orderRef = doc(this.db, COLLECTION_ORDERS, targetDocId);
        await setDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('✅ Status atualizado no Firestore para:', newStatus, targetDocId);
      } catch (err) {
        console.error('⚠️ Erro ao atualizar status no Firestore:', err);
      }
    }

    return updated;
  }

  // Aciona o sino do pedido para chamar na TV
  async ringOrderBell(orderId) {
    const timestamp = Date.now();
    const localOrders = this.getLocalOrders();
    const orderToUpdate = localOrders.find(ord => ord.id === orderId || ord.firestoreDocId === orderId);
    const targetDocId = orderToUpdate?.firestoreDocId || orderToUpdate?.id || orderId;

    const updated = localOrders.map(ord => {
      if (ord.id === orderId || ord.id === targetDocId || ord.firestoreDocId === targetDocId) {
        return { 
          ...ord, 
          status: 'pronto', 
          bellRungAt: timestamp, 
          updatedAt: timestamp 
        };
      }
      return ord;
    });

    this.notifyOrderSubscribers(updated);

    if (syncChannel) {
      syncChannel.postMessage({ 
        type: 'ORDER_BELL_RUNG', 
        payload: { orderId: targetDocId, bellRungAt: timestamp } 
      });
    }

    if (this.isFirebaseReady && this.db) {
      try {
        const orderRef = doc(this.db, COLLECTION_ORDERS, targetDocId);
        await setDoc(orderRef, {
          status: 'pronto',
          bellRungAt: timestamp,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('🔔 Sino acionado no Firestore para pedido:', targetDocId);
      } catch (err) {
        console.error('⚠️ Erro ao registrar sino no Firestore:', err);
      }
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

  // Purgar pedidos antigos / legados com prefixo antigo que ficaram travados
  async purgeLegacyOrders() {
    try {
      const local = this.getLocalOrders();
      const cleanLocal = local.filter(o => !String(o.orderNumber || '').includes('P ped-'));
      if (cleanLocal.length !== local.length) {
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(cleanLocal));
        this.notifyOrderSubscribers(cleanLocal);
      }

      if (this.isFirebaseReady && this.db) {
        const colRef = collection(this.db, COLLECTION_ORDERS);
        const snap = await getDocs(colRef);
        const toDelete = [];
        snap.forEach(docSnap => {
          const d = docSnap.data();
          if (String(d.orderNumber || '').includes('P ped-') || String(docSnap.id || '').includes('P ped-')) {
            toDelete.push(deleteDoc(docSnap.ref));
          }
        });
        if (toDelete.length > 0) {
          await Promise.all(toDelete);
          console.log(`🧹 ${toDelete.length} pedidos com prefixo legado 'P ped-' removidos do Firestore!`);
        }
      }
    } catch (e) {
      console.warn('Erro ao purgar pedidos legados:', e);
    }
  }

  // Limpar TODOS os pedidos (Local + Cloud Firestore)
  async clearAllOrders() {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([]));
    this.resetDailyCounters();
    this.notifyOrderSubscribers([]);
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDERS_CLEARED' });
    }

    if (this.isFirebaseReady && this.db) {
      try {
        const colRef = collection(this.db, COLLECTION_ORDERS);
        const snap = await getDocs(colRef);
        const deletePromises = [];
        snap.forEach(docSnap => {
          deletePromises.push(deleteDoc(docSnap.ref));
        });
        await Promise.all(deletePromises);
        console.log(`🧹 ${deletePromises.length} pedidos apagados com sucesso no Cloud Firestore!`);
      } catch (err) {
        console.error('Erro ao limpar pedidos do Firestore:', err);
      }
    }
  }

  // Compatibilidade com chamadas anteriores
  clearDayOrders() {
    return this.clearAllOrders();
  }
}

export const storageService = new StorageService();
