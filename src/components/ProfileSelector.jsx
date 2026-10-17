import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  UtensilsCrossed, 
  Tv, 
  ChevronDown, 
  LogIn, 
  LogOut, 
  User, 
  Mail, 
  Check, 
  Settings
} from 'lucide-react';
import { authService, PERFIS } from '../services/auth';
import AutoToast from './AutoToast';

export default function ProfileSelector({ onProfileChange, onOpenConfig }) {
  const [activeProfile, setActiveProfile] = useState(authService.getActiveProfile());
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [toast, setToast] = useState(null);
  
  const menuRef = useRef(null);

  useEffect(() => {
    // Escuta mudanças de auth (Google)
    const unsubscribeAuth = authService.onAuthChange((user) => {
      setCurrentUser(user);
    });

    // Escuta mudanças de perfil disparadas externamente
    const handleProfileChange = (e) => {
      setActiveProfile(e.detail);
    };
    window.addEventListener('cantina_profile_changed', handleProfileChange);

    // Fecha dropdown ao clicar fora
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('cantina_profile_changed', handleProfileChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    authService.setActiveProfile(profile);
    setIsOpen(false);
    if (onProfileChange) {
      onProfileChange(profile);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await authService.loginWithGoogle();
      const updatedProfile = authService.getActiveProfile();
      setActiveProfile(updatedProfile);
      if (onProfileChange) {
        onProfileChange(updatedProfile);
      }
      setIsOpen(false);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Login Google',
        message: 'Não foi possível autenticar com o Google.',
        subtext: err.message || 'Verifique se o Google Sign-In está ativado no Firebase Console.'
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsOpen(false);
  };

  // Cores e ícones dos perfis
  const profileDetails = {
    [PERFIS.ADMIN]: {
      label: 'ADMIN',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      desc: 'Caixa PDV, Gestão & Fechamento',
      color: 'text-amber-400'
    },
    [PERFIS.COZINHA]: {
      label: 'COZINHA',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      icon: <UtensilsCrossed className="w-4 h-4 text-orange-400" />,
      desc: 'Painel KDS de Pedidos & Sons',
      color: 'text-orange-400'
    },
    [PERFIS.PUBLICO]: {
      label: 'PÚBLICO',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Tv className="w-4 h-4 text-emerald-400" />,
      desc: 'Painel TV / Chamada de Clientes',
      color: 'text-emerald-400'
    }
  };

  const currentDetails = profileDetails[activeProfile] || profileDetails[PERFIS.ADMIN];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      {/* BOTÃO DO PERFIL NO CANTO SUPERIOR DIREITO */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 shadow-md transition-all active:scale-95"
      >
        {/* Foto do usuário se logado com o Google ou ícone do perfil */}
        {currentUser?.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Foto" 
            className="w-5 h-5 rounded-full border border-amber-400"
          />
        ) : (
          currentDetails.icon
        )}

        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">
            Perfil
          </span>
          <span className={`text-xs font-black tracking-wide leading-tight ${currentDetails.color}`}>
            {currentDetails.label}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN DE PERFIS E LOGIN GOOGLE */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn text-slate-100">
          
          {/* CABEÇALHO DO DROPDOWN */}
          <div className="px-3 py-2 border-b border-slate-800">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Escolher Perfil de Acesso
            </div>
            {currentUser && (
              <div className="mt-1 flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} className="w-7 h-7 rounded-full" alt="avatar" />
                ) : (
                  <User className="w-5 h-5 text-amber-400" />
                )}
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{currentUser.displayName || 'Usuário Google'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* LISTA DOS 3 PERFIS: ADMIN, COZINHA, PÚBLICO */}
          <div className="py-2 space-y-1">
            {[PERFIS.ADMIN, PERFIS.COZINHA, PERFIS.PUBLICO].map((perf) => {
              const item = profileDetails[perf];
              const isSelected = activeProfile === perf;

              return (
                <button
                  key={perf}
                  onClick={() => handleSelectProfile(perf)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-slate-800 border border-slate-600 shadow-md' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            ATIVO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* ÁREA DE AUTENTICAÇÃO COM GOOGLE (PREPARADA) */}
          <div className="mt-2 pt-2 border-t border-slate-800 px-1">
            {!currentUser ? (
              <button
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loadingGoogle ? 'Conectando...' : 'Fazer Logon com Google'}</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar Conta Google</span>
              </button>
            )}

            {/* ATALHO PARA GERENCIAR EMAILS */}
            {onOpenConfig && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenConfig('emails');
                }}
                className="w-full mt-1.5 py-1 text-[11px] text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 transition-colors"
              >
                <Mail className="w-3 h-3" />
                <span>Cadastrar E-mails dos Perfis</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* MODAL BONITO DE 2 SEGUNDOS */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={2000} />

    </div>
  );
}
