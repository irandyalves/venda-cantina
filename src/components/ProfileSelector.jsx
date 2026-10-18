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
  Settings,
  Lock,
  Check, 
  X
} from 'lucide-react';
import { authService, PERFIS } from '../services/auth';
import { storageService } from '../services/storage';

export default function ProfileSelector({ onProfileChange, onOpenConfig, compact = false, align = 'left', title: overrideTitle }) {
  const [environments, setEnvironments] = useState(() => authService.getEnvironments());
  const [activeProfile, setActiveProfile] = useState(authService.getActiveProfile());
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [screensLocked, setScreensLocked] = useState(() => storageService.isScreensLocked());
  
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
    const handleEnvsChange = (e) => {
      setEnvironments(e.detail || authService.getEnvironments());
    };
    const handleScreensLockChange = (e) => {
      setScreensLocked(!!e.detail);
    };
    window.addEventListener('cantina_profile_changed', handleProfileChange);
    window.addEventListener('cantina_environments_changed', handleEnvsChange);
    window.addEventListener('cantina_screens_locked_changed', handleScreensLockChange);

    // Fecha dropdown ao clicar fora
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Limpeza de segurança caso perfil ativo antigo seja TENDA ou QUADRA
    const currentActive = authService.getActiveProfile();
    if (currentActive === 'TENDA' || currentActive === 'QUADRA') {
      handleSelectProfile(PERFIS.ADMIN);
    }

    return () => {
      unsubscribeAuth();
      window.removeEventListener('cantina_profile_changed', handleProfileChange);
      window.removeEventListener('cantina_environments_changed', handleEnvsChange);
      window.removeEventListener('cantina_screens_locked_changed', handleScreensLockChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentEnv = environments.find(e => e.id === activeProfile) || environments[0] || {
    name: 'ADMIN',
    shortName: 'ADMIN',
    type: 'cashier'
  };

  const isSecondaryLocked = screensLocked && (currentEnv.type === 'kitchen' || currentEnv.type === 'display');

  const handleToggle = () => {
    // SE AS TELAS ESTIVEREM TRAVADAS: DESABILITADO TOTALMENTE! Travou, travou! Só abre destravando.
    if (isSecondaryLocked) {
      return;
    }
    if (!isOpen) {
      setEnvironments(authService.getEnvironments());
    }
    setIsOpen(!isOpen);
  };

  const handleSelectProfile = (profileId) => {
    const finalId = (profileId === 'TENDA' || profileId === 'QUADRA') ? PERFIS.ADMIN : profileId;
    setActiveProfile(finalId);
    authService.setActiveProfile(finalId);
    setIsOpen(false);
    if (onProfileChange) {
      onProfileChange(finalId);
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
      console.error('Erro no login Google:', err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsOpen(false);
  };

  const getEnvIcon = (env) => {
    if (!env) return <ShieldCheck className="w-4 h-4 text-amber-400" />;
    if (env.type === 'kitchen') return <UtensilsCrossed className="w-4 h-4 text-orange-400" />;
    if (env.type === 'display') return <Tv className="w-4 h-4 text-emerald-400" />;
    return <ShieldCheck className="w-4 h-4 text-amber-400" />;
  };

  const displayName = overrideTitle || currentEnv.name || currentEnv.shortName || 'AMBIENTE';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      {/* BOTÃO DO SELETOR: VERSÃO COMPACTA (ADMIN PARA CAIXAS) OU VERSÃO TÍTULO (COZINHAS / TELÃO) */}
      {compact ? (
        <button
          type="button"
          disabled={isSecondaryLocked}
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-xs transition-all text-xs font-black uppercase tracking-wider ${
            isSecondaryLocked
              ? 'bg-slate-900/60 border-rose-500/40 opacity-70 cursor-not-allowed text-rose-300'
              : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-amber-500/50 hover:border-amber-400 active:scale-95 cursor-pointer'
          }`}
          title={isSecondaryLocked ? 'Tela travada pelo Administrador' : 'Alternar ambiente de trabalho'}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black">ADMIN</span>
          {isSecondaryLocked ? (
            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
          ) : (
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled={isSecondaryLocked}
          onClick={handleToggle}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all ${
            isSecondaryLocked 
              ? 'bg-slate-900/60 border-rose-500/40 opacity-80 cursor-not-allowed text-slate-300' 
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 hover:border-slate-500 text-white cursor-pointer active:scale-95'
          }`}
          title={isSecondaryLocked ? 'Tela travada pelo Administrador. Desabilidado.' : 'Alternar ambiente de trabalho'}
        >
          {/* Ícone */}
          <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-red-600 rounded-lg shadow shrink-0">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Foto" 
                className="w-4 h-4 rounded-full border border-amber-400"
              />
            ) : (
              <span className="text-white">
                {getEnvIcon(currentEnv)}
              </span>
            )}
          </div>

          {/* Nome do ambiente (sem a palavra AMBIENTE em cima, mesmo tamanho de COZINHA BATATA) */}
          <span className="text-sm sm:text-base font-black tracking-wide text-white uppercase leading-none">
            {displayName}
          </span>

          {/* Indicador de trava ou chevron */}
          <div className="flex items-center gap-1 ml-0.5">
            {isSecondaryLocked ? (
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" title="Tela travada pelo Administrador" />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </button>
      )}

      {/* DROPDOWN DE AMBIENTES E LOGIN GOOGLE */}
      {isOpen && (
        <div className={`absolute mt-2 w-80 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn text-slate-100 ${
          align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
        }`}>
          
          {/* CABEÇALHO DO DROPDOWN */}
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Escolher Ambiente de Trabalho
            </div>
            {onOpenConfig && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenConfig('emails');
                }}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                title="Configurar Ambientes"
              >
                <Settings className="w-3 h-3" />
                <span>Configurar</span>
              </button>
            )}
          </div>

          {currentUser && (
            <div className="mx-2 mt-2 flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
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

          {/* LISTA DE TODOS OS AMBIENTES (ADMIN, COZINHA, COZINHA 2, PÚBLICO, ETC) */}
          <div className="py-2 space-y-1 max-h-72 overflow-y-auto">
            {environments
              .filter(env => {
                const id = (env?.id || '').toUpperCase();
                const name = (env?.name || '').toUpperCase();
                const desc = (env?.description || '').toLowerCase();
                return (
                  id !== 'TENDA' && 
                  name !== 'TENDA' && 
                  id !== 'QUADRA' && 
                  name !== 'QUADRA' && 
                  !id.includes('TENDA') &&
                  !(id === 'COZINHA_2' && desc.includes('fogões adicionais'))
                );
              })
              .map((env) => {
                const isSelected = activeProfile === env.id;

              return (
                <button
                  key={env.id}
                  onClick={() => handleSelectProfile(env.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-800 border border-slate-600 shadow-md' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                      {getEnvIcon(env)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                        <span>{env.name}</span>
                        {env.shortName && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {env.shortName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {env.description || (env.type === 'kitchen' ? 'Tela da Cozinha' : env.type === 'display' ? 'Painel TV' : 'Operação de Caixa')}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* RODAPÉ DO MENU COM LOGIN GOOGLE */}
          <div className="p-2 border-t border-slate-800 flex flex-col gap-1.5">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar da Conta Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{loadingGoogle ? 'Conectando...' : 'Conectar com Google'}</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
