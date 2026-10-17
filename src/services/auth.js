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

// Perfis disponíveis
export const PERFIS = {
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  PUBLICO: 'PUBLICO'
};

// Configuração padrão de e-mails autorizados por perfil
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

  // --- GESTÃO DO PERFIL ATIVO (ADMIN / COZINHA / PUBLICO) ---

  getActiveProfile() {
    const saved = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (saved && Object.values(PERFIS).includes(saved)) {
      return saved;
    }
    return PERFIS.ADMIN; // Padrão
  }

  setActiveProfile(profile) {
    if (!Object.values(PERFIS).includes(profile)) return;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
    window.dispatchEvent(new CustomEvent('cantina_profile_changed', { detail: profile }));
  }

  // --- REGRAS DE E-MAILS POR PERFIL ---

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

    if (rules.ADMIN?.includes(cleanEmail)) return PERFIS.ADMIN;
    if (rules.COZINHA?.includes(cleanEmail)) return PERFIS.COZINHA;
    if (rules.PUBLICO?.includes(cleanEmail)) return PERFIS.PUBLICO;

    return null; // Não categorizado
  }
}

export const authService = new AuthService();
