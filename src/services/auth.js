// Serviço de Autenticação e Perfis (Google Auth + Perfis Admin / Cozinha / Público)

import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { storageService } from './storage';

const PROFILES_STORAGE_KEY = 'cantina_user_profiles';
const ACTIVE_PROFILE_KEY = 'cantina_active_profile';
const ENVIRONMENTS_STORAGE_KEY = 'cantina_environments';

// Perfis padrão disponíveis
export const PERFIS = {
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  PUBLICO: 'PUBLICO'
};

// Ambientes padrão do sistema
export const DEFAULT_ENVIRONMENTS = [
  {
    id: 'ADMIN',
    name: 'ADMIN (Caixa & Gestão)',
    shortName: 'ADMIN',
    type: 'cashier',
    icon: 'ShieldCheck',
    color: 'amber',
    isSystem: true,
    description: 'Caixa PDV, Gestão & Fechamento de Turno'
  },
  {
    id: 'COZINHA',
    name: 'COZINHA (KDS Principal)',
    shortName: 'COZINHA',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'orange',
    isSystem: true,
    description: 'Painel KDS de Pedidos, Alertas & Sons'
  },
  {
    id: 'PUBLICO',
    name: 'PÚBLICO (Painel TV)',
    shortName: 'PÚBLICO',
    type: 'display',
    icon: 'Tv',
    color: 'emerald',
    isSystem: true,
    description: 'Painel TV de Chamada de Clientes'
  }
];

// Configuração padrão de e-mails autorizados por perfil/ambiente (e-mail opcional)
const DEFAULT_EMAIL_RULES = {
  ADMIN: ['irandyalves@gmail.com'],
  COZINHA: [],
  PUBLICO: []
};

class AuthService {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.authListeners = [];
    this.initAuth();
  }

  initAuth() {
    if (storageService.app) {
      try {
        this.auth = getAuth(storageService.app);
        onAuthStateChanged(this.auth, (user) => {
          this.currentUser = user;
          this.notifyListeners(user);

          // Se logou com o Google, verifica automaticamente o perfil correspondente ao email
          if (user?.email) {
            const matchedProfile = this.getProfileForEmail(user.email);
            if (matchedProfile) {
              this.setActiveProfile(matchedProfile);
            }
          }
        });
      } catch (err) {
        console.warn('Firebase Auth não inicializado:', err);
      }
    }
  }

  // Registra listener de autenticação
  onAuthChange(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(user) {
    this.authListeners.forEach(cb => cb(user));
  }

  // Login com Google
  async loginWithGoogle() {
    if (!this.auth) {
      this.initAuth();
    }
    if (!this.auth) {
      throw new Error('Firebase Auth não está configurado. Verifique as credenciais do Firebase nas Configurações.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      // Checa se o e-mail tem perfil definido
      const profile = this.getProfileForEmail(user.email);
      if (profile) {
        this.setActiveProfile(profile);
      }
      return user;
    } catch (err) {
      console.error('Erro no login com Google:', err);
      throw err;
    }
  }

  // Logout
  async logout() {
    if (this.auth) {
      await signOut(this.auth);
    }
    this.currentUser = null;
    this.notifyListeners(null);
  }

  // --- GESTÃO DE AMBIENTES (CONFIGURÁVEIS PELO USUÁRIO) ---

  getEnvironments() {
    try {
      const saved = localStorage.getItem(ENVIRONMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que os ambientes essenciais do sistema existem
          const ids = new Set(parsed.map(e => e.id));
          const missingDefaults = DEFAULT_ENVIRONMENTS.filter(d => !ids.has(d.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {
      console.error('Erro ao ler ambientes configurados:', e);
    }
    return DEFAULT_ENVIRONMENTS;
  }

  saveEnvironments(environments) {
    localStorage.setItem(ENVIRONMENTS_STORAGE_KEY, JSON.stringify(environments));
    window.dispatchEvent(new CustomEvent('cantina_environments_changed', { detail: environments }));
  }

  addEnvironment({ name, shortName, type = 'kitchen', icon = 'UtensilsCrossed', color = 'orange', description = '' }) {
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('O nome do ambiente é obrigatório');

    const cleanShortName = (shortName || cleanName).trim().toUpperCase();
    const slug = cleanShortName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/gi, '_');
    const id = slug || `ENV_${Date.now()}`;

    const envs = this.getEnvironments();
    if (envs.some(e => e.id === id)) {
      throw new Error(`Já existe um ambiente com identificador "${id}". Escolha outro nome.`);
    }

    const newEnv = {
      id,
      name: cleanName,
      shortName: cleanShortName,
      type, // 'kitchen', 'cashier', 'display'
      icon,
      color,
      isSystem: false,
      description: description || `Ambiente ${cleanName}`
    };

    const updated = [...envs, newEnv];
    this.saveEnvironments(updated);

    // Inicializa regra de emails para o novo ambiente (vazia)
    const rules = this.getEmailRules();
    if (!rules[id]) {
      rules[id] = [];
      this.saveEmailRules(rules);
    }

    return newEnv;
  }

  updateEnvironment(id, updatedData) {
    const envs = this.getEnvironments();
    const updated = envs.map(e => {
      if (e.id === id) {
        return {
          ...e,
          name: updatedData.name ? updatedData.name.trim() : e.name,
          shortName: updatedData.shortName ? updatedData.shortName.trim().toUpperCase() : e.shortName,
          type: updatedData.type || e.type,
          icon: updatedData.icon || e.icon,
          color: updatedData.color || e.color,
          description: updatedData.description !== undefined ? updatedData.description : e.description
        };
      }
      return e;
    });

    this.saveEnvironments(updated);
    return updated.find(e => e.id === id);
  }

  deleteEnvironment(id) {
    const envs = this.getEnvironments();
    const target = envs.find(e => e.id === id);
    if (!target) return;
    if (target.isSystem) {
      throw new Error('Ambientes padrão do sistema não podem ser excluídos.');
    }

    const updated = envs.filter(e => e.id !== id);
    this.saveEnvironments(updated);

    // Remove do email rules
    const rules = this.getEmailRules();
    if (rules[id]) {
      delete rules[id];
      this.saveEmailRules(rules);
    }

    // Se o ambiente excluído estava ativo, volta para ADMIN
    if (this.getActiveProfile() === id) {
      this.setActiveProfile(PERFIS.ADMIN);
    }
  }

  // --- GESTÃO DO PERFIL / AMBIENTE ATIVO ---

  getActiveProfile() {
    const saved = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const envs = this.getEnvironments();
    if (saved && envs.some(e => e.id === saved)) {
      return saved;
    }
    return PERFIS.ADMIN; // Padrão
  }

  getActiveEnvironment() {
    const activeId = this.getActiveProfile();
    const envs = this.getEnvironments();
    return envs.find(e => e.id === activeId) || envs[0] || DEFAULT_ENVIRONMENTS[0];
  }

  setActiveProfile(profileOrId) {
    const envId = typeof profileOrId === 'object' ? profileOrId.id : profileOrId;
    const envs = this.getEnvironments();
    const matched = envs.find(e => e.id === envId);
    if (!matched) return;

    localStorage.setItem(ACTIVE_PROFILE_KEY, matched.id);
    window.dispatchEvent(new CustomEvent('cantina_profile_changed', { detail: matched.id }));
    window.dispatchEvent(new CustomEvent('cantina_environment_changed', { detail: matched }));
  }

  // --- REGRAS DE E-MAILS POR PERFIL / AMBIENTE ---

  getEmailRules() {
    try {
      const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler regras de perfis:', e);
    }
    return DEFAULT_EMAIL_RULES;
  }

  saveEmailRules(rules) {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(rules));
  }

  addEmailToProfile(profile, email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    const rules = this.getEmailRules();
    if (!rules[profile]) rules[profile] = [];

    if (!rules[profile].includes(cleanEmail)) {
      rules[profile].push(cleanEmail);
      this.saveEmailRules(rules);
    }
  }

  removeEmailFromProfile(profile, email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rules = this.getEmailRules();
    if (rules[profile]) {
      rules[profile] = rules[profile].filter(e => e !== cleanEmail);
      this.saveEmailRules(rules);
    }
  }

  getProfileForEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rules = this.getEmailRules();

    for (const [profileId, emailList] of Object.entries(rules)) {
      if (Array.isArray(emailList) && emailList.includes(cleanEmail)) {
        return profileId;
      }
    }

    return null; // Não categorizado
  }
}

export const authService = new AuthService();
