import React, { useState, useEffect } from 'react';
import CashierView from './components/CashierView';
import KitchenView from './components/KitchenView';
import DisplayView from './components/DisplayView';
import ConfigModal from './components/ConfigModal';
import { authService, PERFIS } from './services/auth';
import { storageService } from './services/storage';

export default function App() {
  // Encontra o ambiente inicial pela hash (#caixa, #cozinha, #cozinha-2, #tv) ou pelo perfil ativo
  const resolveEnvironmentFromHashOrActive = () => {
    const rawHash = window.location.hash.toLowerCase().replace('#', '').trim();
    const envs = authService.getEnvironments();

    if (rawHash) {
      // 1. Busca correspondência exata de ID ou shortName
      const exactMatch = envs.find(e => 
        e.id.toLowerCase() === rawHash || 
        (e.shortName && e.shortName.toLowerCase().replace(/[\s_]+/g, '-') === rawHash.replace(/[\s_]+/g, '-')) ||
        (e.shortName && e.shortName.toLowerCase().replace(/[\s-]+/g, '_') === rawHash.replace(/[\s-]+/g, '_'))
      );
      if (exactMatch) return exactMatch;

      // 2. Busca por tipo comum na URL
      if (rawHash.includes('tv') || rawHash.includes('display') || rawHash.includes('painel')) {
        const dEnv = envs.find(e => e.type === 'display');
        if (dEnv) return dEnv;
      }
      if (rawHash.includes('caixa') || rawHash.includes('cashier') || rawHash.includes('admin')) {
        const aEnv = envs.find(e => e.type === 'cashier');
        if (aEnv) return aEnv;
      }
      if (rawHash.includes('cozinha') || rawHash.includes('kitchen')) {
        const kEnv = envs.find(e => e.type === 'kitchen');
        if (kEnv) return kEnv;
      }
    }

    return authService.getActiveEnvironment();
  };

  const [activeEnvironment, setActiveEnvironment] = useState(resolveEnvironmentFromHashOrActive);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configInitialTab, setConfigInitialTab] = useState('products');

  useEffect(() => {
    const handleHashChange = () => {
      if (storageService.isScreensLocked() && (activeEnvironment.type === 'kitchen' || activeEnvironment.type === 'display')) {
        const resolved = resolveEnvironmentFromHashOrActive();
        if (resolved.type === 'cashier') {
          // Reverte hash caso aparelho esteja travado e alguém tente forçar #caixa
          const currentSlug = (activeEnvironment.shortName || activeEnvironment.name).toLowerCase().replace(/[\s_]+/g, '-');
          window.location.hash = currentSlug;
          return;
        }
      }

      const resolved = resolveEnvironmentFromHashOrActive();
      setActiveEnvironment(resolved);
      authService.setActiveProfile(resolved.id);
    };

    const handleEnvironmentChange = (e) => {
      const env = e.detail;
      if (env) {
        setActiveEnvironment(env);
        const slug = (env.shortName || env.name).toLowerCase().replace(/[\s_]+/g, '-');
        window.location.hash = slug;
      }
    };

    const handleProfileChange = (e) => {
      const profileId = e.detail;
      const envs = authService.getEnvironments();
      const matched = envs.find(x => x.id === profileId);
      if (matched) {
        setActiveEnvironment(matched);
        const slug = (matched.shortName || matched.name).toLowerCase().replace(/[\s_]+/g, '-');
        window.location.hash = slug;
      }
    };

    const handleEnvsChange = () => {
      const resolved = resolveEnvironmentFromHashOrActive();
      setActiveEnvironment(resolved);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('cantina_environment_changed', handleEnvironmentChange);
    window.addEventListener('cantina_profile_changed', handleProfileChange);
    window.addEventListener('cantina_environments_changed', handleEnvsChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('cantina_environment_changed', handleEnvironmentChange);
      window.removeEventListener('cantina_profile_changed', handleProfileChange);
      window.removeEventListener('cantina_environments_changed', handleEnvsChange);
    };
  }, []);

  const navigateTo = (target) => {
    const envs = authService.getEnvironments();
    let targetEnv = null;

    if (typeof target === 'object' && target?.id) {
      targetEnv = target;
    } else if (typeof target === 'string') {
      if (target === 'cashier') targetEnv = envs.find(e => e.type === 'cashier') || envs[0];
      else if (target === 'kitchen') targetEnv = envs.find(e => e.type === 'kitchen') || envs[1];
      else if (target === 'display') targetEnv = envs.find(e => e.type === 'display') || envs[2];
      else targetEnv = envs.find(e => e.id === target || e.shortName.toLowerCase() === target.toLowerCase());
    }

    if (targetEnv) {
      authService.setActiveProfile(targetEnv.id);
      setActiveEnvironment(targetEnv);
      const slug = (targetEnv.shortName || targetEnv.name).toLowerCase().replace(/[\s_]+/g, '-');
      window.location.hash = slug;
    }
  };

  const handleOpenConfig = (tab = 'products') => {
    setConfigInitialTab(tab);
    setIsConfigOpen(true);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {activeEnvironment.type === 'cashier' && (
        <CashierView 
          environment={activeEnvironment}
          onOpenConfig={handleOpenConfig} 
          onNavigate={navigateTo}
        />
      )}

      {activeEnvironment.type === 'kitchen' && (
        <KitchenView 
          environment={activeEnvironment}
          onNavigate={navigateTo}
        />
      )}

      {activeEnvironment.type === 'display' && (
        <DisplayView 
          environment={activeEnvironment}
          onNavigate={navigateTo}
        />
      )}

      {/* Modal de Configurações, Cardápio e Ambientes */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        initialTab={configInitialTab}
        onClose={() => setIsConfigOpen(false)} 
      />
    </div>
  );
}
