// Camada de armazenamento e sincronização (Firebase Firestore na Nuvem + Sincronizador Local de Alta Performance)

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import { DEFAULT_ENVIRONMENTS } from '../data/defaultEnvironments';

const FIREBASE_CONFIG_KEY = 'cantina_firebase_config';
const LOCAL_ORDERS_KEY = 'cantina_local_orders';
const LOCAL_PRODUCTS_KEY = 'cantina_local_products';
const LOCAL_COUNTERS_KEY = 'cantina_local_counters';
const TV_SETTINGS_KEY = 'cantina_tv_settings';
const LOCAL_CURRENT_EVENT_KEY = 'cantina_current_event';
const LOCAL_EVENTS_LIST_KEY = 'cantina_events_list';
const LOCAL_TURNO_HISTORY_KEY = 'cantina_turno_history';
const SHOW_CURRENCY_SYMBOL_KEY = 'cantina_show_currency_symbol';
const COLLECTION_ORDERS = 'cantina_pedidos';
const COLLECTION_HISTORY = 'cantina_historico_turnos';
const COLLECTION_SETTINGS = 'cantina_configuracoes';
const DOC_ENVIRONMENTS = 'ambientes';
const DOC_ROUTING = 'roteamento';
const DOC_SECURITY = 'seguranca';
const LOCAL_SCREENS_LOCKED_KEY = 'cantina_screens_locked';

// Configuração padrão lida a partir das variáveis de ambiente (.env)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAujmh1TuWRCS53zz1BZXIQvgHbXVibKwo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "carga-patrimonio.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "carga-patrimonio",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "carga-patrimonio.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "478068393511",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:478068393511:web:d61f883ee1c1506887b002"
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
    this.unsubscribeEnvironments = null;
    this.unsubscribeRouting = null;
    this.unsubscribeHistory = null;
    this.unsubscribeProducts = null;
    this.unsubscribeEvents = null;
    this.unsubscribeSecurity = null;
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
      setTimeout(() => this.syncLocalConfigsToCloudIfEmpty(), 2000);
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
    if (this.unsubscribeEnvironments) {
      try { this.unsubscribeEnvironments(); } catch (_) {}
      this.unsubscribeEnvironments = null;
    }
    if (this.unsubscribeRouting) {
      try { this.unsubscribeRouting(); } catch (_) {}
      this.unsubscribeRouting = null;
    }
    if (this.unsubscribeHistory) {
      try { this.unsubscribeHistory(); } catch (_) {}
      this.unsubscribeHistory = null;
    }
    if (this.unsubscribeProducts) {
      try { this.unsubscribeProducts(); } catch (_) {}
      this.unsubscribeProducts = null;
    }
    if (this.unsubscribeEvents) {
      try { this.unsubscribeEvents(); } catch (_) {}
      this.unsubscribeEvents = null;
    }
    if (this.unsubscribeSecurity) {
      try { this.unsubscribeSecurity(); } catch (_) {}
      this.unsubscribeSecurity = null;
    }

    try {
      // 1. Listener de pedidos e configurações em tempo real
      const colRef = collection(this.db, COLLECTION_ORDERS);
      this.unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const docId = docSnap.id;
          if (docId.startsWith('__config_') || docId.startsWith('__')) return;
          list.push({ ...docSnap.data(), id: docId, firestoreDocId: docId });
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

      // 2. Listener dedicado de Ambientes em tempo real na nuvem (coleção cantina_configuracoes)
      const envsDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_ENVIRONMENTS);
      this.unsubscribeEnvironments = onSnapshot(envsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.environments) && data.environments.length > 0) {
            console.log(`📡 [Firestore Realtime] ${data.environments.length} ambientes sincronizados via cantina_configuracoes/ambientes`);
            this.handleCloudEnvironments(data.environments);
          }
        }
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar ambientes:', err);
      });

      // 3. Listener de Roteamento de Produção em tempo real na nuvem
      const routingDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_ROUTING);
      this.unsubscribeRouting = onSnapshot(routingDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.routing) {
            console.log('📡 [Firestore Realtime] Roteamento de produção sincronizado da nuvem');
            this.handleCloudRouting(data.routing);
          }
        }
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar roteamento:', err);
      });

      // 4. Listener de Histórico de Turnos em tempo real na nuvem (coleção cantina_historico_turnos)
      const historyColRef = collection(this.db, COLLECTION_HISTORY);
      this.unsubscribeHistory = onSnapshot(historyColRef, (snapshot) => {
        const historyList = [];
        snapshot.forEach((docSnap) => {
          historyList.push({ ...docSnap.data(), id: docSnap.id });
        });
        historyList.sort((a, b) => (Number(b.archivedAt) || 0) - (Number(a.archivedAt) || 0));
        console.log(`📡 [Firestore Realtime] ${historyList.length} turnos arquivados sincronizados da nuvem`);
        localStorage.setItem(LOCAL_TURNO_HISTORY_KEY, JSON.stringify(historyList));
        window.dispatchEvent(new CustomEvent('cantina_turno_history_changed', { detail: historyList }));
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar histórico de turnos:', err);
      });

      // 5. Listener de Produtos e Cardápio em tempo real na nuvem
      const productsDocRef = doc(this.db, COLLECTION_SETTINGS, 'produtos');
      this.unsubscribeProducts = onSnapshot(productsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.categories) && data.categories.length > 0) {
            console.log(`📡 [Firestore Realtime] Cardápio (${data.categories.length} categorias) sincronizado da nuvem`);
            this.saveProducts(data.categories, false);
          }
        }
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar produtos:', err);
      });

      // 6. Listener de Eventos em tempo real na nuvem
      const eventsDocRef = doc(this.db, COLLECTION_SETTINGS, 'eventos');
      this.unsubscribeEvents = onSnapshot(eventsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.currentEvent) {
            localStorage.setItem(LOCAL_CURRENT_EVENT_KEY, JSON.stringify(data.currentEvent));
            window.dispatchEvent(new CustomEvent('cantina_event_changed', { detail: data.currentEvent }));
          }
          if (Array.isArray(data?.eventsList)) {
            localStorage.setItem(LOCAL_EVENTS_LIST_KEY, JSON.stringify(data.eventsList));
            window.dispatchEvent(new CustomEvent('cantina_events_list_changed', { detail: data.eventsList }));
          }
        }
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar eventos:', err);
      });

      // 7. Listener de Trava de Telas (Segurança Monitores/Tablets) em tempo real na nuvem
      const securityDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_SECURITY);
      this.unsubscribeSecurity = onSnapshot(securityDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const locked = !!data?.screensLocked;
          console.log(`📡 [Firestore Realtime] Trava de telas: ${locked ? 'TRAVADAS' : 'DESTRAVADAS'}`);
          this.setLocalScreensLocked(locked, false);
        }
      }, (err) => {
        console.warn('⚠️ [Firestore Realtime] Aviso ao escutar segurança:', err);
      });
    } catch (err) {
      console.error('❌ Erro ao configurar onSnapshot:', err);
    }
  }

  // Semeia ambientes padrão no Firestore
  async seedCloudEnvironments() {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      await this.saveEnvironmentsCloud(DEFAULT_ENVIRONMENTS);
      console.log('🌱 Ambientes padrão semeados no Firestore');
    } catch (err) {
      console.warn('Falha ao semear ambientes:', err);
    }
  }

  // Sincroniza cardápio e eventos locais para a nuvem caso ainda não existam no Firestore
  async syncLocalConfigsToCloudIfEmpty() {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      const prodDocRef = doc(this.db, COLLECTION_SETTINGS, 'produtos');
      const prodSnap = await getDoc(prodDocRef);
      if (!prodSnap.exists()) {
        const localProds = this.getProducts();
        await setDoc(prodDocRef, {
          categories: localProds,
          updatedAt: serverTimestamp()
        });
        console.log('🌱 Cardápio local sincronizado com a nuvem Firestore');
      }

      const evtDocRef = doc(this.db, COLLECTION_SETTINGS, 'eventos');
      const evtSnap = await getDoc(evtDocRef);
      if (!evtSnap.exists()) {
        const currentEvent = this.getCurrentEvent();
        const eventsList = this.getEventsList();
        await setDoc(evtDocRef, {
          currentEvent,
          eventsList,
          updatedAt: serverTimestamp()
        });
        console.log('🌱 Eventos locais sincronizados com a nuvem Firestore');
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar configurações locais na nuvem:', e);
    }
  }

  // Processa ambientes recebidos do Firestore e atualiza todos os componentes
  handleCloudEnvironments(cloudEnvs) {
    try {
      const isLegacyJunk = (e) => {
        const id = (e?.id || '').toUpperCase();
        const name = (e?.name || '').toUpperCase();
        const desc = (e?.description || '').toLowerCase();
        return (
          id === 'TENDA' || 
          name === 'TENDA' || 
          id === 'QUADRA' || 
          name === 'QUADRA' || 
          id.includes('TENDA') ||
          (id === 'COZINHA_2' && desc.includes('fogões adicionais'))
        );
      };
      const cleaned = (cloudEnvs || []).filter(e => !isLegacyJunk(e));
      let hadChanges = cleaned.length !== (cloudEnvs || []).length;

      const updated = cleaned.map(env => {
        const defaultMatch = DEFAULT_ENVIRONMENTS.find(d => d.id === env.id);
        let finalName = env.name || defaultMatch?.name || env.id;
        if (env.id === 'COZINHA' && (finalName.includes('COZINHA 1') || finalName === 'COZINHA')) {
          finalName = 'COZINHA PIZZA';
          hadChanges = true;
        }
        let finalShortName = env.shortName || finalName;
        if (env.id === 'COZINHA' && (finalShortName.includes('COZINHA 1') || finalShortName === 'COZINHA')) {
          finalShortName = 'COZINHA PIZZA';
          hadChanges = true;
        }
        return {
          ...(defaultMatch || {}),
          ...env,
          name: finalName,
          shortName: finalShortName
        };
      });

      const cloudIds = new Set(updated.map(e => e.id));
      const missingSystemDefaults = DEFAULT_ENVIRONMENTS.filter(d => d.isSystem && !cloudIds.has(d.id));
      const fullList = [...updated, ...missingSystemDefaults];

      localStorage.setItem('cantina_environments', JSON.stringify(fullList));
      window.dispatchEvent(new CustomEvent('cantina_environments_changed', { detail: fullList }));

      if (syncChannel) {
        syncChannel.postMessage({ type: 'ENVIRONMENTS_UPDATED', payload: fullList });
      }

      if (hadChanges || missingSystemDefaults.length > 0) {
        this.saveEnvironmentsCloud(fullList);
      }
    } catch (e) {
      console.error('Erro ao processar ambientes da nuvem:', e);
    }
  }

  broadcastEnvironments(environments) {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ENVIRONMENTS_UPDATED', payload: environments });
    }
  }

  // Salva ambientes no Firestore na nuvem para propagar a todos os aparelhos
  async saveEnvironmentsCloud(environments) {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      const settingsDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_ENVIRONMENTS);
      const payload = {
        environments,
        updatedAt: serverTimestamp()
      };
      await setDoc(settingsDocRef, payload);
      console.log('☁️ Ambientes salvos no Firestore na nuvem com sucesso:', environments.length);
    } catch (err) {
      console.error('⚠️ Erro ao salvar ambientes no Firestore:', err);
    }
  }

  // Processa roteamento de produção vindo da nuvem
  handleCloudRouting(cloudRouting) {
    try {
      localStorage.setItem('cantina_production_routing', JSON.stringify(cloudRouting));
      window.dispatchEvent(new CustomEvent('cantina_production_routing_changed', { detail: cloudRouting }));

      if (syncChannel) {
        syncChannel.postMessage({ type: 'PRODUCTION_ROUTING_UPDATED', payload: cloudRouting });
      }
    } catch (e) {
      console.error('Erro ao processar roteamento da nuvem:', e);
    }
  }

  // Salva roteamento no Firestore na nuvem
  async saveProductionRoutingCloud(routing) {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      const configDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_ROUTING);
      await setDoc(configDocRef, {
        routing,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('☁️ Roteamento salvo no Firestore na nuvem com sucesso');
    } catch (err) {
      console.error('⚠️ Erro ao salvar roteamento no Firestore:', err);
    }
  }


  // Monitoramento leve da conexão em tempo real (garante reconexão sem estourar cota do Firestore)
  startHeartbeatPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    // O onSnapshot do Cloud Firestore já entrega atualizações em tempo real via WebSocket
    // com 0ms de latência e consumo mínimo (apenas 1 leitura quando um pedido novo chega ou é modificado).
    // O polling forçado de getDocs a cada 2s foi desativado para proteger a cota diária de 50.000 leituras.
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isFirebaseReady) {
          console.log('📱 [Device Wakeup] Tela reativada, assegurando conexão Firestore em tempo real...');
          this.startFirestoreListener();
        }
      });
      window.addEventListener('online', () => {
        if (this.isFirebaseReady) {
          console.log('🌐 [Network Online] Conexão restabelecida, reconectando Firestore...');
          this.startFirestoreListener();
        }
      });
    }

    // Verificação leve de pulso a cada 30 segundos: apenas restaura o listener se tiver sido encerrado
    this.pollTimer = setInterval(() => {
      if (this.isFirebaseReady && !this.unsubscribeFirestore) {
        console.log('🔄 [Health Check] Restaurando listener do Firestore...');
        this.startFirestoreListener();
      }
    }, 30000);
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
        if (event.data?.type === 'EVENT_CHANGED') {
          window.dispatchEvent(new CustomEvent('cantina_event_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'ENVIRONMENTS_UPDATED') {
          if (Array.isArray(event.data.payload)) {
            localStorage.setItem('cantina_environments', JSON.stringify(event.data.payload));
          }
          window.dispatchEvent(new CustomEvent('cantina_environments_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'PRODUCTION_ROUTING_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_production_routing_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'CURRENCY_SYMBOL_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_currency_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'ORDER_TIME_LIMITS_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_order_time_limits_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'SCREENS_LOCKED_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_screens_locked_changed', { detail: !!event.data.payload }));
        }
        if (event.data?.type === 'BACKGROUND_SETTINGS_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_background_settings_changed', { detail: event.data.payload }));
        }
        if (event.data?.type === 'SYSTEM_SETTINGS_UPDATED') {
          window.dispatchEvent(new CustomEvent('cantina_system_settings_changed', { detail: event.data.payload }));
        }
      };
    }

    // Escuta evento 'storage' para navegadores que não compartilham BroadcastChannel
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'cantina_system_settings') {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_system_settings_changed', { detail: parsed }));
          } catch (_) {}
        }
        if (e.key === 'cantina_card_section_background') {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_background_settings_changed', { detail: parsed }));
          } catch (_) {}
        }
        if (e.key === SHOW_CURRENCY_SYMBOL_KEY) {
          window.dispatchEvent(new CustomEvent('cantina_currency_changed', { detail: e.newValue === 'true' }));
        }
        if (e.key === LOCAL_SCREENS_LOCKED_KEY) {
          window.dispatchEvent(new CustomEvent('cantina_screens_locked_changed', { detail: e.newValue === 'true' }));
        }
        if (e.key === 'cantina_order_time_limits') {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_order_time_limits_changed', { detail: parsed }));
          } catch (_) {}
        }
        if (e.key === LOCAL_ORDERS_KEY) {
          const local = this.getLocalOrders();
          this.orderSubscribers.forEach(cb => {
            try { cb(local); } catch (_) {}
          });
        }
        if (e.key === LOCAL_CURRENT_EVENT_KEY) {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_event_changed', { detail: parsed }));
          } catch (_) {}
        }
        if (e.key === 'cantina_environments') {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_environments_changed', { detail: parsed }));
          } catch (_) {}
        }
        if (e.key === 'cantina_production_routing') {
          try {
            const parsed = JSON.parse(e.newValue);
            window.dispatchEvent(new CustomEvent('cantina_production_routing_changed', { detail: parsed }));
          } catch (_) {}
        }
      });
    }
  }

  // Verifica se as telas secundárias (Cozinha e Telão) estão travadas
  isScreensLocked() {
    try {
      return localStorage.getItem(LOCAL_SCREENS_LOCKED_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  // Define status de trava localmente e propaga para outras abas
  setLocalScreensLocked(locked, broadcast = true) {
    const val = locked ? 'true' : 'false';
    localStorage.setItem(LOCAL_SCREENS_LOCKED_KEY, val);
    window.dispatchEvent(new CustomEvent('cantina_screens_locked_changed', { detail: !!locked }));
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'SCREENS_LOCKED_UPDATED', payload: !!locked });
    }
  }

  // Trava ou destrava telas com persistência no Firestore em tempo real
  async setScreensLocked(locked) {
    this.setLocalScreensLocked(locked, true);
    if (this.isFirebaseReady && this.db) {
      try {
        const securityDocRef = doc(this.db, COLLECTION_SETTINGS, DOC_SECURITY);
        await setDoc(securityDocRef, {
          screensLocked: !!locked,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log(`🔒 [Segurança] Status de trava de telas salvo na nuvem: ${locked ? 'TRAVADA' : 'DESTRAVADA'}`);
      } catch (err) {
        console.error('⚠️ Erro ao salvar status de trava no Firestore:', err);
      }
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

  saveProducts(categories, syncCloud = true) {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(categories));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRODUCTS_UPDATED', payload: categories });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cantina_products_changed', { detail: categories }));
    }
    if (syncCloud && this.isFirebaseReady && this.db) {
      try {
        const productsDocRef = doc(this.db, COLLECTION_SETTINGS, 'produtos');
        setDoc(productsDocRef, {
          categories,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => console.warn('Falha ao salvar produtos na nuvem:', e));
      } catch (err) {
        console.warn('Erro ao salvar produtos no Firestore:', err);
      }
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

  // --- CONFIGURAÇÕES DE FUNDO DA SEÇÃO DOS CARDS (CAIXA) ---
  getBackgroundSettings() {
    const defaultSettings = {
      theme: 'cream', // 'cream', 'dark', 'kraft', 'wood', 'slate', 'brick', 'linen', 'marble', 'terracotta', 'metal', 'carbon', 'custom', 'upload'
      textureOpacity: 100, // 0 a 100 (% de intensidade da textura)
      textureDepth: 100, // 40 a 200 (% de profundidade / relevo da textura)
      textureSize: 100, // 30 a 250 (% do tamanho da textura)
      darkness: 0, // 0 a 80 (% para tornar mais claro ou escuro)
      customColor: '#eace9a',
      customImage: ''
    };
    try {
      const raw = localStorage.getItem('cantina_card_section_background');
      if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Erro ao ler configurações de fundo:', e);
    }
    return defaultSettings;
  }

  saveBackgroundSettings(settings) {
    const safeSettings = {
      theme: settings?.theme || 'cream',
      textureOpacity: Math.max(0, Math.min(100, Number(settings?.textureOpacity ?? 100))),
      textureDepth: Math.max(30, Math.min(250, Number(settings?.textureDepth ?? 100))),
      textureSize: Math.max(20, Math.min(300, Number(settings?.textureSize ?? 100))),
      darkness: Math.max(0, Math.min(90, Number(settings?.darkness ?? 0))),
      customColor: settings?.customColor || '#eace9a',
      customImage: settings?.customImage || ''
    };
    localStorage.setItem('cantina_card_section_background', JSON.stringify(safeSettings));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'BACKGROUND_SETTINGS_UPDATED', payload: safeSettings });
    }
    window.dispatchEvent(new CustomEvent('cantina_background_settings_changed', { detail: safeSettings }));
  }

  // --- CONFIGURAÇÕES GERAIS DO SISTEMA ---
  getSystemSettings() {
    const defaultSettings = {
      // EFEITOS
      cardPulsing: true,             // Efeito pulsante/girando nos cards em preparo
      cardSoundEnabled: true,        // Sons e alertas sonoros do sistema
      // TEMPOS
      callPasswordDuration: 6,       // Duração da chamada de senha na TV (em segundos: 4, 6, 8, 10, 15)
      // DISTÂNCIA ENTRE CARDS (COZINHA, TELÃO, CAIXA)
      kitchenCardSpacing: 'normal',  // 'compact' (space-y-1), 'normal' (space-y-1.5), 'relaxed' (space-y-2.5), 'spacious' (space-y-4)
      displayCardSpacing: 'normal',  // 'compact' (space-y-1), 'normal' (space-y-1.5), 'relaxed' (space-y-2.5), 'spacious' (space-y-4)
      cashierCardSpacing: 'normal',  // 'compact' (space-y-0.5), 'normal' (space-y-1.5), 'relaxed' (space-y-2.5), 'spacious' (space-y-4)
      // FONTES
      fontScale: 'normal'            // 'normal', 'large', 'xl'
    };
    try {
      const raw = localStorage.getItem('cantina_system_settings');
      if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Erro ao ler configurações do sistema:', e);
    }
    return defaultSettings;
  }

  saveSystemSettings(settings) {
    const safeSettings = {
      ...this.getSystemSettings(),
      ...settings
    };
    localStorage.setItem('cantina_system_settings', JSON.stringify(safeSettings));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'SYSTEM_SETTINGS_UPDATED', payload: safeSettings });
    }
    window.dispatchEvent(new CustomEvent('cantina_system_settings_changed', { detail: safeSettings }));
  }

  // --- LIMITES DE TEMPO E CORES DOS PEDIDOS (COZINHA) ---
  getOrderTimeLimits() {
    const defaultLimits = {
      greenLimit: 3,    // até 3 min = Verde (Normal)
      blueLimit: 6,     // até 6 min = Azul (No prazo)
      yellowLimit: 10,  // até 10 min = Amarelo (Alerta 1)
      orangeLimit: 15   // até 15 min = Laranja (Atrasado) -> Acima = Vermelho (Muito Atrasado)
    };
    try {
      const raw = localStorage.getItem('cantina_order_time_limits');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          greenLimit: Number(parsed.greenLimit) || 3,
          blueLimit: Number(parsed.blueLimit) || 6,
          yellowLimit: Number(parsed.yellowLimit) || 10,
          orangeLimit: Number(parsed.orangeLimit) || 15
        };
      }
    } catch {}
    return defaultLimits;
  }

  saveOrderTimeLimits(limits) {
    const green = Math.max(1, Number(limits.greenLimit) || 3);
    const blue = Math.max(green + 1, Number(limits.blueLimit) || (green + 3));
    const yellow = Math.max(blue + 1, Number(limits.yellowLimit) || (blue + 4));
    const orange = Math.max(yellow + 1, Number(limits.orangeLimit) || (yellow + 5));

    const safeLimits = {
      greenLimit: green,
      blueLimit: blue,
      yellowLimit: yellow,
      orangeLimit: orange
    };
    localStorage.setItem('cantina_order_time_limits', JSON.stringify(safeLimits));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDER_TIME_LIMITS_UPDATED', payload: safeLimits });
    }
    window.dispatchEvent(new CustomEvent('cantina_order_time_limits_changed', { detail: safeLimits }));
  }

  // --- CONFIGURAÇÃO DE EXIBIÇÃO DE MOEDA (R$) ---
  getShowCurrencySymbol() {
    return localStorage.getItem(SHOW_CURRENCY_SYMBOL_KEY) === 'true';
  }

  setShowCurrencySymbol(enabled) {
    const val = Boolean(enabled);
    localStorage.setItem(SHOW_CURRENCY_SYMBOL_KEY, val ? 'true' : 'false');
    if (syncChannel) {
      syncChannel.postMessage({ type: 'CURRENCY_SYMBOL_UPDATED', payload: val });
    }
    window.dispatchEvent(new CustomEvent('cantina_currency_changed', { detail: val }));
  }

  formatPrice(val, showSymbol = null) {
    const shouldShow = showSymbol !== null ? Boolean(showSymbol) : this.getShowCurrencySymbol();
    const num = Number(val) || 0;
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    return shouldShow ? `R$ ${formatted}` : formatted;
  }

  // --- ROTEAMENTO DE PRODUÇÃO: ENVIAR PARA COZINHA E EXIBIR NA TV ---
  getProductionRouting() {
    try {
      const raw = localStorage.getItem('cantina_production_routing');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          sendToKitchen: parsed.sendToKitchen || {},
          showOnTV: parsed.showOnTV || {},
          destinationEnv: parsed.destinationEnv || {},
          cashierDestinations: parsed.cashierDestinations || {}
        };
      }
    } catch (e) {
      console.error('Erro ao ler roteamento de produção:', e);
    }
    // Padrão: Apenas Pizza vai para a cozinha e TV. Açaí, Batata e outros ficam na tenda/balcão
    return {
      sendToKitchen: {
        'pizza': true,
        'pedaco': true,
        'inteira': true,
        'acai': false,
        'batata': false,
        'outros': false
      },
      showOnTV: {
        'pizza': true,
        'pedaco': true,
        'inteira': true,
        'acai': false,
        'batata': false,
        'outros': false
      },
      destinationEnv: {
        'pizza': 'COZINHA',
        'pedaco': 'COZINHA',
        'inteira': 'COZINHA',
        'acai': 'none',
        'batata': 'none',
        'outros': 'none'
      },
      cashierDestinations: {}
    };
  }

  setCashierTerminalDestination(terminal, kitchenId) {
    try {
      const current = this.getProductionRouting();
      const updated = {
        ...current,
        cashierDestinations: {
          ...(current.cashierDestinations || {}),
          [terminal]: kitchenId
        }
      };
      this.saveProductionRouting(updated);
    } catch (e) {
      console.error('Erro ao salvar destino do caixa:', e);
    }
  }

  getCashiersForKitchen(kitchenId) {
    try {
      const routing = this.getProductionRouting();
      const map = routing.cashierDestinations || {};
      const matches = [];
      for (const [term, dest] of Object.entries(map)) {
        if (dest === kitchenId) {
          matches.push(term);
        }
      }
      if (matches.length > 0) {
        return matches.sort().join(', ');
      }
    } catch (_) {}
    return 'Todos os Caixas';
  }

  getTargetProductsForKitchen(kitchenId) {
    try {
      const routing = this.getProductionRouting();
      const categories = this.getCategories();
      const envId = kitchenId || 'COZINHA';
      const matches = new Set();

      for (const cat of categories) {
        const dest = routing.destinationEnv?.[cat.id];
        if (dest === envId || (!dest && cat.id === 'pizza' && envId === 'COZINHA')) {
          matches.add(cat.name.toUpperCase());
        }
      }

      if (matches.size > 0) {
        return Array.from(matches).join(', ');
      }
    } catch (_) {}
    return 'PIZZA';
  }

  saveProductionRouting(routing) {
    localStorage.setItem('cantina_production_routing', JSON.stringify(routing));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'PRODUCTION_ROUTING_UPDATED', payload: routing });
    }
    window.dispatchEvent(new CustomEvent('cantina_production_routing_changed', { detail: routing }));
    this.saveProductionRoutingCloud(routing);
  }

  // --- GESTÃO DE EVENTOS (FESTAS, FESTIVAIS E TURNOS) ---
  getCurrentEvent() {
    try {
      const raw = localStorage.getItem(LOCAL_CURRENT_EVENT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler evento atual:', e);
    }
    return {
      id: 'evt_geral',
      name: 'Cantina Geral',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
  }

  saveCurrentEvent(eventObj, syncCloud = true) {
    if (!eventObj || !eventObj.name) return;
    localStorage.setItem(LOCAL_CURRENT_EVENT_KEY, JSON.stringify(eventObj));
    
    // Atualiza também na lista de eventos
    const events = this.getEventsList();
    const exists = events.some(e => e.id === eventObj.id);
    let updated;
    if (!exists) {
      events.unshift(eventObj);
      updated = events;
      this.saveEventsList(events, false);
    } else {
      updated = events.map(e => e.id === eventObj.id ? eventObj : e);
      this.saveEventsList(updated, false);
    }

    if (syncChannel) {
      syncChannel.postMessage({ type: 'EVENT_CHANGED', payload: eventObj });
    }
    window.dispatchEvent(new CustomEvent('cantina_event_changed', { detail: eventObj }));

    if (syncCloud && this.isFirebaseReady && this.db) {
      try {
        const eventsDocRef = doc(this.db, COLLECTION_SETTINGS, 'eventos');
        setDoc(eventsDocRef, {
          currentEvent: eventObj,
          eventsList: updated,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => console.warn('Falha ao salvar evento na nuvem:', e));
      } catch (err) {
        console.warn('Erro ao salvar evento no Firestore:', err);
      }
    }
    return eventObj;
  }

  getEventsList() {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_LIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler lista de eventos:', e);
    }
    return [
      {
        id: 'evt_geral',
        name: 'Cantina Geral',
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      }
    ];
  }

  saveEventsList(events, syncCloud = true) {
    localStorage.setItem(LOCAL_EVENTS_LIST_KEY, JSON.stringify(events));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'EVENTS_LIST_CHANGED', payload: events });
    }
    window.dispatchEvent(new CustomEvent('cantina_events_list_changed', { detail: events }));

    if (syncCloud && this.isFirebaseReady && this.db) {
      try {
        const eventsDocRef = doc(this.db, COLLECTION_SETTINGS, 'eventos');
        setDoc(eventsDocRef, {
          eventsList: events,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => console.warn('Falha ao salvar lista de eventos na nuvem:', e));
      } catch (err) {
        console.warn('Erro ao salvar lista de eventos no Firestore:', err);
      }
    }
  }

  createEvent(name, date) {
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('O nome do evento é obrigatório.');
    const eventDate = date || new Date().toISOString().split('T')[0];
    const newEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: cleanName,
      date: eventDate,
      createdAt: Date.now()
    };
    this.saveCurrentEvent(newEvent);
    return newEvent;
  }

  // --- PEDIDOS (EM TEMPO REAL CLOUD FIRESTORE) ---

  async createOrder(orderData) {
    const timestamp = Date.now();
    const orderId = 'ord_' + timestamp + '_' + Math.random().toString(36).substr(2, 6);
    const activeEvt = this.getCurrentEvent();
    const order = {
      ...orderData,
      id: orderId,
      createdAt: timestamp,
      status: 'em_preparo', // Chegou na cozinha já entra Em Preparação direto!
      eventId: orderData.eventId || activeEvt.id,
      eventName: orderData.eventName || activeEvt.name,
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

  // --- HISTÓRICO DE TURNOS (ARQUIVAMENTO E BACKUP) ---
  getTurnoHistory() {
    try {
      const raw = localStorage.getItem(LOCAL_TURNO_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveTurnoHistory(history) {
    localStorage.setItem(LOCAL_TURNO_HISTORY_KEY, JSON.stringify(history));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'TURNO_HISTORY_UPDATED', payload: history });
    }
    window.dispatchEvent(new CustomEvent('cantina_turno_history_changed', { detail: history }));
  }

  // Cria cópia completa de segurança de todas as vendas e comandas no histórico
  async archiveCurrentTurno() {
    const localOrders = this.getLocalOrders();
    const currentEvent = this.getCurrentEvent();
    const timestamp = Date.now();
    const turnoId = 'turno_' + timestamp;

    const activeOrders = localOrders.filter(o => o.status !== 'cancelado');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const snapshot = {
      id: turnoId,
      archivedAt: timestamp,
      archivedAtFormatted: new Date(timestamp).toLocaleString('pt-BR'),
      event: currentEvent,
      totalOrders: localOrders.length,
      activeOrdersCount: activeOrders.length,
      cancelledOrdersCount: localOrders.length - activeOrders.length,
      totalRevenue: totalRevenue,
      paymentBreakdown: {
        pix: activeOrders.filter(o => o.paymentMethod === 'PIX').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
        dinheiro: activeOrders.filter(o => o.paymentMethod === 'DINHEIRO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
        debito: activeOrders.filter(o => o.paymentMethod === 'DEBITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
        credito: activeOrders.filter(o => o.paymentMethod === 'CREDITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
      },
      orders: localOrders
    };

    // 1. Salva no histórico local
    const history = this.getTurnoHistory();
    history.unshift(snapshot);
    this.saveTurnoHistory(history);
    console.log(`📦 [Histórico Local] Turno "${currentEvent.name}" arquivado com ${localOrders.length} vendas (R$ ${totalRevenue.toFixed(2)})`);

    // 2. Salva no Cloud Firestore na nuvem
    if (this.isFirebaseReady && this.db) {
      try {
        const turnoRef = doc(this.db, COLLECTION_HISTORY, turnoId);
        await setDoc(turnoRef, {
          ...snapshot,
          firebaseArchivedAt: serverTimestamp()
        });
        console.log('☁️ [Cloud Firestore] Cópia do turno arquivada na nuvem com sucesso:', turnoId);
      } catch (err) {
        console.error('⚠️ Falha ao arquivar histórico no Firestore:', err);
      }
    }

    return snapshot;
  }

  // Arquiva cópia no histórico e ZERA as filas ativas (Caixa, Cozinha, TV)
  async archiveAndClearOrders() {
    const snapshot = await this.archiveCurrentTurno();
    await this.clearAllOrders();
    return snapshot;
  }

  // Restaura um turno arquivado de volta como o caixa ativo atual
  async restoreTurnoAsActive(turnoId) {
    const history = this.getTurnoHistory();
    const turno = history.find(t => t.id === turnoId);
    if (!turno) {
      throw new Error('Turno arquivado não encontrado no histórico.');
    }

    const ordersToRestore = Array.isArray(turno.orders) ? turno.orders : [];

    // 1. Atualiza e salva localmente
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(ordersToRestore));
    this.notifyOrderSubscribers(ordersToRestore);

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ORDERS_RESTORED', payload: ordersToRestore });
    }

    // 2. Se Firebase estiver conectado, atualiza no Cloud Firestore
    if (this.isFirebaseReady && this.db) {
      try {
        const colRef = collection(this.db, COLLECTION_ORDERS);
        const snap = await getDocs(colRef);
        const deletePromises = [];
        snap.forEach(docSnap => {
          if (!docSnap.id.startsWith('__config_')) {
            deletePromises.push(deleteDoc(docSnap.ref));
          }
        });
        await Promise.all(deletePromises);

        const savePromises = ordersToRestore.map(ord => {
          const docId = ord.firestoreDocId || ord.id || `ped_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const orderRef = doc(this.db, COLLECTION_ORDERS, docId);
          return setDoc(orderRef, {
            ...ord,
            id: docId,
            restoredAt: serverTimestamp()
          });
        });
        await Promise.all(savePromises);
        console.log(`♻️ [Restaurar Turno] ${ordersToRestore.length} pedidos restaurados com sucesso no Firestore!`);
      } catch (err) {
        console.error('⚠️ Erro ao restaurar turno no Firestore:', err);
      }
    }

    return ordersToRestore;
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
          if (docSnap.id.startsWith('__config_')) return;
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
export const formatPrice = (val, showSymbol = null) => storageService.formatPrice(val, showSymbol);

// Textura clássica artesanal
const CREAM_TEXTURE = "url('cream-texture.png')";

// SVGs procedurais de alta fidelidade para as texturas adicionais
const SVG_WOOD = `url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h120v2H0zM0 30h120v2H0zM0 58h120v2H0z' fill='%23000000' fill-opacity='0.25'/%3E%3Cpath d='M0 2h120v1H0zM0 32h120v1H0z' fill='%23ffffff' fill-opacity='0.08'/%3E%3Cpath d='M60 0v30h2V0zM30 30v30h2V30zM90 30v30h2V30z' fill='%23000000' fill-opacity='0.2'/%3E%3C/svg%3E"), url('cream-texture.png')`;

const SVG_BRICK = `url("data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v2H0V0zm0 15h60v2H0v-2zm30 0h2v15h-2V15zM0 0h2v15H0V0zm60 0h-2v15h2V0z' fill='%23000000' fill-opacity='0.32'/%3E%3Cpath d='M0 2h60v1H0V2zm0 15h60v1H0v-1z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E"), url('cream-texture.png')`;

const SVG_LINEN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20 0H0V0h20v20z' fill='%23ffffff' fill-opacity='0.06' fill-rule='evenodd'/%3E%3Cpath d='M0 10h40v1H0v-1zm0 20h40v1H0v-1zM10 0v40h1V0h-1zm20 0v40h1V0h-1z' fill='%23000000' fill-opacity='0.08'/%3E%3C/svg%3E"), url('cream-texture.png')`;

const SVG_MARBLE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.18'/%3E%3C/svg%3E"), url('cream-texture.png')`;

const SVG_METAL = `url("data:image/svg+xml,%3Csvg width='120' height='24' viewBox='0 0 120 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h120v1H0zM0 6h120v1H0zM0 12h120v1H0zM0 18h120v1H0z' fill='%23ffffff' fill-opacity='0.12'/%3E%3Cpath d='M0 3h120v1H0zM0 9h120v1H0zM0 15h120v1H0zM0 21h120v1H0z' fill='%23000000' fill-opacity='0.18'/%3E%3C/svg%3E"), url('cream-texture.png')`;

const SVG_CARBON = `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='%23ffffff' fill-opacity='0.05'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23ffffff' fill-opacity='0.05'/%3E%3Crect x='8' width='8' height='8' fill='%23000000' fill-opacity='0.18'/%3E%3Crect y='8' width='8' height='8' fill='%23000000' fill-opacity='0.18'/%3E%3C/svg%3E")`;

export const BACKGROUND_PRESETS = [
  {
    id: 'cream',
    name: 'Creme Texturado',
    desc: 'Clássico artesanal de cantina',
    bgColor: '#eace9a',
    bgImage: CREAM_TEXTURE,
    baseSize: 460,
    previewColor: '#eace9a'
  },
  {
    id: 'dark',
    name: 'Escuro Clássico',
    desc: 'Dark slate elegante e moderno',
    bgColor: '#0f172a',
    bgImage: CREAM_TEXTURE,
    baseSize: 460,
    previewColor: '#0f172a'
  },
  {
    id: 'kraft',
    name: 'Papel Kraft',
    desc: 'Tom terroso de pacote rústico',
    bgColor: '#b89065',
    bgImage: CREAM_TEXTURE,
    baseSize: 400,
    previewColor: '#b89065'
  },
  {
    id: 'wood',
    name: 'Madeira Aconchegante',
    desc: 'Tom acolhedor amadeirado de tábua',
    bgColor: '#5a3518',
    bgImage: SVG_WOOD,
    baseSize: 480,
    previewColor: '#5a3518'
  },
  {
    id: 'slate',
    name: 'Ardósia / Grafite',
    desc: 'Fundo neutro escuro com relevo mineral',
    bgColor: '#1e293b',
    bgImage: CREAM_TEXTURE,
    baseSize: 460,
    previewColor: '#1e293b'
  },
  // NOVOS 6 PRESETS RICOS:
  {
    id: 'brick',
    name: 'Tijolo / Forno à Lenha',
    desc: 'Estilo rústico tradicional de cantina e pizzaria',
    bgColor: '#7a2712',
    bgImage: SVG_BRICK,
    baseSize: 360,
    previewColor: '#7a2712'
  },
  {
    id: 'linen',
    name: 'Linho / Tecido Cru',
    desc: 'Trama artesanal de toalha aconchegante',
    bgColor: '#d4c2a5',
    bgImage: SVG_LINEN,
    baseSize: 320,
    previewColor: '#d4c2a5'
  },
  {
    id: 'marble',
    name: 'Mármore Nero / Granito',
    desc: 'Bancada escura nobre e refinada',
    bgColor: '#151518',
    bgImage: SVG_MARBLE,
    baseSize: 440,
    previewColor: '#151518'
  },
  {
    id: 'terracotta',
    name: 'Terracota Italiana',
    desc: 'Argila tostada quente tradicional da Toscana',
    bgColor: '#963616',
    bgImage: CREAM_TEXTURE,
    baseSize: 420,
    previewColor: '#963616'
  },
  {
    id: 'metal',
    name: 'Aço Escovado / Inox',
    desc: 'Cozinha industrial e lanchonete moderna',
    bgColor: '#334155',
    bgImage: SVG_METAL,
    baseSize: 380,
    previewColor: '#475569'
  },
  {
    id: 'carbon',
    name: 'Carbono / Moderno',
    desc: 'Visual esportivo e tecnológico de alta performance',
    bgColor: '#090d16',
    bgImage: SVG_CARBON,
    baseSize: 260,
    previewColor: '#090d16'
  },
  {
    id: 'custom',
    name: 'Personalizado',
    desc: 'Escolha livre da cor com textura clássica',
    bgColor: '#eace9a',
    bgImage: CREAM_TEXTURE,
    baseSize: 460,
    previewColor: '#d97706'
  },
  {
    id: 'upload',
    name: 'Upload Próprio',
    desc: 'Sua própria imagem ou foto de textura',
    bgColor: '#1e293b',
    bgImage: '',
    baseSize: 460,
    previewColor: '#06b6d4'
  }
];

export const getSectionBackgroundStyle = (settings) => {
  const theme = settings?.theme || 'cream';
  const customColor = settings?.customColor || '#eace9a';
  const customImage = settings?.customImage || '';
  const preset = BACKGROUND_PRESETS.find(p => p.id === theme) || BACKGROUND_PRESETS[0];

  let bgImage = preset.bgImage;
  let baseSize = preset.baseSize || 460;

  if (theme === 'upload') {
    bgImage = customImage ? `url('${customImage}')` : '';
    baseSize = 480;
  }

  // Escala dinâmica do tamanho da textura (reduzir / aumentar)
  const textureScale = (Number(settings?.textureSize ?? 100)) / 100;
  const calculatedBgSize = bgImage ? `${Math.round(baseSize * textureScale)}px auto` : 'auto';

  return {
    bgColor: theme === 'custom' ? customColor : (theme === 'upload' ? (customColor || '#1e293b') : preset.bgColor),
    bgImage,
    bgSize: calculatedBgSize,
    textureDepth: Number(settings?.textureDepth ?? 100),
    textureSize: Number(settings?.textureSize ?? 100),
    textureOpacity: Number(settings?.textureOpacity ?? 100),
    darkness: Number(settings?.darkness ?? 0)
  };
};
