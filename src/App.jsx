import React, { useState, useEffect } from 'react';
import CashierView from './components/CashierView';
import KitchenView from './components/KitchenView';
import DisplayView from './components/DisplayView';
import ConfigModal from './components/ConfigModal';

export default function App() {
  // Lê a rota inicial pela hash (#caixa, #cozinha, #tv) ou padrão 'cashier'
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('cozinha') || hash.includes('kitchen')) return 'kitchen';
    if (hash.includes('tv') || hash.includes('display') || hash.includes('painel')) return 'display';
    return 'cashier';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Sincroniza com a hash da URL para permitir links diretos
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'cashier') window.location.hash = 'caixa';
    else if (view === 'kitchen') window.location.hash = 'cozinha';
    else if (view === 'display') window.location.hash = 'tv';
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {currentView === 'cashier' && (
        <CashierView 
          onOpenConfig={() => setIsConfigOpen(true)} 
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

      {/* Modal de Configurações (Acessível pela engrenagem do Caixa) */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
    </div>
  );
}
