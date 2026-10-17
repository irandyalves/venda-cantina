import React, { useState, useEffect } from 'react';
import CashierView from './components/CashierView';
import KitchenView from './components/KitchenView';
import DisplayView from './components/DisplayView';
import ConfigModal from './components/ConfigModal';
import { authService, PERFIS } from './services/auth';

export default function App() {
  // Lê a rota inicial pela hash (#caixa, #cozinha, #tv) ou pelo perfil ativo
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('cozinha') || hash.includes('kitchen')) return 'kitchen';
    if (hash.includes('tv') || hash.includes('display') || hash.includes('painel')) return 'display';
    if (hash.includes('caixa') || hash.includes('cashier') || hash.includes('admin')) return 'cashier';

    const activeProfile = authService.getActiveProfile();
    if (activeProfile === PERFIS.COZINHA) return 'kitchen';
    if (activeProfile === PERFIS.PUBLICO) return 'display';
    return 'cashier';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configInitialTab, setConfigInitialTab] = useState('products');

  // Sincroniza com a hash da URL e com o evento de perfil
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(getInitialView());
    };

    const handleProfileChange = (e) => {
      const profile = e.detail;
      if (profile === PERFIS.ADMIN) {
        navigateTo('cashier');
      } else if (profile === PERFIS.COZINHA) {
        navigateTo('kitchen');
      } else if (profile === PERFIS.PUBLICO) {
        navigateTo('display');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('cantina_profile_changed', handleProfileChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('cantina_profile_changed', handleProfileChange);
    };
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'cashier') window.location.hash = 'caixa';
    else if (view === 'kitchen') window.location.hash = 'cozinha';
    else if (view === 'display') window.location.hash = 'tv';
  };

  const handleOpenConfig = (tab = 'products') => {
    setConfigInitialTab(tab);
    setIsConfigOpen(true);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {currentView === 'cashier' && (
        <CashierView 
          onOpenConfig={handleOpenConfig} 
          onNavigate={navigateTo}
        />
      )}

      {currentView === 'kitchen' && (
        <KitchenView 
          onNavigate={navigateTo}
        />
      )}

      {currentView === 'display' && (
        <DisplayView 
          onNavigate={navigateTo}
        />
      )}

      {/* Modal de Configurações & E-mails (Acessível pela engrenagem ou pelo menu de perfil) */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        initialTab={configInitialTab}
        onClose={() => setIsConfigOpen(false)} 
      />
    </div>
  );
}
