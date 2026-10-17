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

import { 
  PERFIS, 
  DEFAULT_ENVIRONMENTS, 
  DEFAULT_EMAIL_RULES 
} from '../data/defaultEnvironments';

export { PERFIS, DEFAULT_ENVIRONMENTS, DEFAULT_EMAIL_RULES };

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
          // EXORCIZA TENDA E QUADRA DE QUALQUER LISTA RESIDUAL
          const isLegacyJunk = (e) => {
            const id = (e.id || '').toUpperCase();
            const name = (e.name || '').toUpperCase();
            return id === 'TENDA' || name === 'TENDA' || id === 'QUADRA' || name === 'QUADRA' || id.includes('TENDA');
          };
          const cleaned = parsed.filter(e => !isLegacyJunk(e));
          const hadLegacyJunk = cleaned.length !== parsed.length;

          // Garante apenas que os ambientes essenciais do sistema (ADMIN, COZINHA, PÚBLICO) existam
          const ids = new Set(cleaned.map(e => e.id));
          const missingSystemDefaults = DEFAULT_ENVIRONMENTS.filter(d => d.isSystem && !ids.has(d.id));

          // NUNCA sobrescreve nomes ou descrições personalizados pelo usuário e remove qualquer menção residual a 'KDS'
          const updated = cleaned.map(env => {
            const defaultMatch = DEFAULT_ENVIRONMENTS.find(d => d.id === env.id);
            const rawDesc = env.description !== undefined ? env.description : (defaultMatch?.description || '');
            const cleanDesc = rawDesc.replace(/\bpainel\s+kds\b/gi, 'Painel').replace(/\bkds\b/gi, '').replace(/\s{2,}/g, ' ').trim();

            const actualType = env.type || (defaultMatch?.type || 'kitchen');
            const isDisplay = actualType === 'display';
            const isCashier = actualType === 'cashier';
            const icon = isDisplay ? 'Tv' : isCashier ? 'ShieldCheck' : 'UtensilsCrossed';
            const color = isDisplay ? 'emerald' : isCashier ? 'amber' : 'orange';

            if (defaultMatch && defaultMatch.isSystem) {
              return {
                ...defaultMatch,
                ...env,
                name: env.name || defaultMatch.name,
                shortName: env.shortName || defaultMatch.shortName,
                description: cleanDesc,
                type: actualType,
                icon,
                color
              };
            }
            return {
              ...env,
              description: cleanDesc,
              type: actualType,
              icon,
              color
            };
          });

          const finalResult = missingSystemDefaults.length > 0 
            ? [...updated, ...missingSystemDefaults] 
            : updated;

          if (hadLegacyJunk || missingSystemDefaults.length > 0) {
            localStorage.setItem(ENVIRONMENTS_STORAGE_KEY, JSON.stringify(finalResult));
            storageService.broadcastEnvironments(finalResult);
            storageService.saveEnvironmentsCloud(finalResult);
          }
          return finalResult;
        }
      }
    } catch (e) {
      console.error('Erro ao ler ambientes configurados:', e);
    }

    try {
      localStorage.setItem(ENVIRONMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_ENVIRONMENTS));
      storageService.saveEnvironmentsCloud(DEFAULT_ENVIRONMENTS);
    } catch (_) {}
    return DEFAULT_ENVIRONMENTS;
  }

  saveEnvironments(environments) {
    localStorage.setItem(ENVIRONMENTS_STORAGE_KEY, JSON.stringify(environments));
    window.dispatchEvent(new CustomEvent('cantina_environments_changed', { detail: environments }));
    storageService.broadcastEnvironments(environments);
    // Sincroniza em tempo real com a nuvem no Cloud Firestore para que todos os outros dispositivos vejam imediatamente
    storageService.saveEnvironmentsCloud(environments);
  }

  addEnvironment({ name, shortName, type = 'kitchen', icon, color, description = '' }) {
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('O nome do ambiente é obrigatório');

    const cleanShortName = (shortName || cleanName).trim().toUpperCase();
    const slug = cleanShortName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/gi, '_');
    const id = slug || `ENV_${Date.now()}`;

    const envs = this.getEnvironments();
    if (envs.some(e => e.id === id)) {
      throw new Error(`Já existe um ambiente com identificador "${id}". Escolha outro nome.`);
    }

    const isDisplay = type === 'display';
    const isCashier = type === 'cashier';
    const finalIcon = isDisplay ? 'Tv' : isCashier ? 'ShieldCheck' : (icon || 'UtensilsCrossed');
    const finalColor = isDisplay ? 'emerald' : isCashier ? 'amber' : (color || 'orange');

    const newEnv = {
      id,
      name: cleanName,
      shortName: cleanShortName,
      type, // 'kitchen', 'cashier', 'display'
      icon: finalIcon,
      color: finalColor,
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
        const nextType = updatedData.type || e.type;
        const isDisplay = nextType === 'display';
        const isCashier = nextType === 'cashier';
        const nextIcon = isDisplay ? 'Tv' : isCashier ? 'ShieldCheck' : (updatedData.icon || 'UtensilsCrossed');
        const nextColor = isDisplay ? 'emerald' : isCashier ? 'amber' : (updatedData.color || 'orange');

        return {
          ...e,
          name: updatedData.name ? updatedData.name.trim() : e.name,
          shortName: updatedData.shortName ? updatedData.shortName.trim().toUpperCase() : e.shortName,
          type: nextType,
          icon: nextIcon,
          color: nextColor,
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
    if (saved && saved !== 'TENDA' && saved !== 'QUADRA' && envs.some(e => e.id === saved)) {
      return saved;
    }
    localStorage.setItem(ACTIVE_PROFILE_KEY, PERFIS.ADMIN);
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
