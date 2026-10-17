import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Flame
} from 'lucide-react';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import ProfileSelector from './ProfileSelector';

export default function DisplayView({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightOrder, setHighlightOrder] = useState(null);
  
  // Configurações da TV vindas do Storage (definidas pelo Caixa)
  const [tvSettings, setTvSettings] = useState(storageService.getTVSettings());

  const prevReadyIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Escuta configurações da TV
  useEffect(() => {
    const handleSettingsChange = (e) => {
      setTvSettings(e.detail);
    };
    window.addEventListener('cantina_tv_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('cantina_tv_settings_changed', handleSettingsChange);
  }, []);

  // Fullscreen automático se configurado
  useEffect(() => {
    if (tvSettings.autoFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  }, [tvSettings.autoFullscreen]);

  // Escutar pedidos em tempo real
  useEffect(() => {
    const unsubscribe = storageService.subscribeOrders((allOrders) => {
      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);

      // Detectar novo pedido que ficou PRONTO para soar Ding-Dong e piscar na tela (se som ativo)
      const readyOrders = todayOrders.filter(o => o.status === 'pronto');
      if (tvSettings.soundEnabled && !isFirstLoadRef.current) {
        readyOrders.forEach(order => {
          if (!prevReadyIdsRef.current.has(order.id)) {
            soundService.playReadySound();
            setHighlightOrder(order);
            setTimeout(() => setHighlightOrder(null), 8000);
          }
        });
      }

      prevReadyIdsRef.current = new Set(readyOrders.map(o => o.id));
      isFirstLoadRef.current = false;
      setOrders(todayOrders);
    });

    return () => unsubscribe();
  }, [tvSettings.soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const preparingOrders = orders.filter(o => o.status === 'em_preparo');
  const readyOrders = orders.filter(o => o.status === 'pronto');
  const deliveredOrders = orders.filter(o => o.status === 'entregue').slice(0, 8);

  // Helper para formatar o texto do item conforme o padrão solicitado:
  // Ex: PIZZA [PEDAÇO (verde bold)] : MARGUERITTA (lilás brilho bold)
  const renderItemDetails = (order) => {
    const categoryName = (order.categoryName || order.category || 'ITEM').toUpperCase();
    const variationName = (order.variationName || '').toUpperCase();
    const itemName = (order.itemName || '').toUpperCase();

    // Se tiver variação explícita (como PEDAÇO ou INTEIRA na pizza)
    if (variationName) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-sm sm:text-base">
          <span className="font-black text-slate-200 tracking-wide">{categoryName}</span>
          <span className="text-emerald-400 font-black bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 shadow-sm">
            [{variationName}]
          </span>
          <span className="text-slate-400 font-bold">:</span>
          <span className="text-purple-300 font-black tracking-wider uppercase drop-shadow-[0_0_10px_rgba(216,180,254,0.7)] text-base sm:text-lg">
            {itemName}
          </span>
        </div>
      );
    }

    // Se for Açaí ou Batata
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-sm sm:text-base">
        <span className="font-black text-slate-200 tracking-wide">{categoryName}</span>
        <span className="text-emerald-400 font-black bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 shadow-sm">
          [{itemName}]
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden select-none">
      
      {/* CABEÇALHO DA TV:
          - TÍTULO MUDADO PARA "PEDIDOS"
          - RETIRADO BOTÃO ATIVAR SOM
          - RETIRADO BOTÃO VOLTAR AO CAIXA
          - BOTÃO TELA CHEIA E PERFIL
      */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl shadow-lg">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              PEDIDOS
            </h1>
            <p className="text-xs text-slate-400 font-medium">Acompanhe seu pedido na tela</p>
          </div>
        </div>

        {/* CONTROLES: APENAS TELA CHEIA E SELETOR DE PERFIL */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Alternar Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>

          {/* PERFIL NO CANTO SUPERIOR DIREITO */}
          <ProfileSelector 
            onProfileChange={(profile) => {
              if (profile === 'ADMIN') onNavigate('cashier');
              else if (profile === 'COZINHA') onNavigate('kitchen');
            }}
          />
        </div>
      </header>

      {/* BANNER DE CHAMADA ESPECIAL QUANDO UM PEDIDO FICA PRONTO */}
      {highlightOrder && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 px-6 py-3.5 flex items-center justify-center gap-4 animate-bounce shadow-2xl">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
          <div className="text-center">
            <span className="text-xs uppercase font-black tracking-widest bg-black/25 text-white px-3 py-0.5 rounded-full">
              🔔 PEDIDO PRONTO PARA RETIRADA!
            </span>
            <div className="text-3xl font-black mt-0.5 text-white drop-shadow">
              Comanda <span className="underline decoration-yellow-300">{highlightOrder.orderNumber}</span> — {highlightOrder.customerName?.toUpperCase()}
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* ========================================================
          ÁREA PRINCIPAL: EM PREPARAÇÃO CENTRALIZADO
         ======================================================== */}
      <main className={`flex-1 p-4 sm:p-6 overflow-hidden ${
        tvSettings.showDelivered 
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' 
          : 'flex flex-col items-center justify-center'
      }`}>
        
        {/* COLUNA CENTRAL: EM PREPARAÇÃO */}
        <section className={`flex flex-col bg-slate-900/85 rounded-3xl border-2 border-amber-500/50 p-5 shadow-2xl overflow-hidden ${
          tvSettings.showDelivered ? 'lg:col-span-8' : 'w-full max-w-5xl h-full'
        }`}>
          
          {/* CABEÇALHO DA SEÇÃO EM PREPARAÇÃO */}
          <div className="flex items-center justify-between border-b-2 border-amber-500/30 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
                <Flame className="w-7 h-7 animate-pulse" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-amber-300 uppercase tracking-widest">
                  EM PREPARAÇÃO
                </h2>
                <p className="text-xs text-slate-400">Na cozinha sendo preparado agora</p>
              </div>
            </div>

            <span className="text-2xl font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-1 rounded-2xl font-mono">
              {preparingOrders.length}
            </span>
          </div>

          {/* LISTA DE CARDS: DOBRO DO TAMANHO DA FONTE + NOME EM MAIÚSCULO + SEM COZINHA */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-12">
                <Clock className="w-14 h-14 mb-2 opacity-40 animate-pulse" />
                <p className="text-base font-bold text-slate-400">Nenhum pedido em preparo no momento</p>
                <p className="text-xs text-slate-600 mt-1">Os novos pedidos do caixa aparecerão aqui automaticamente</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 shadow-xl hover:border-amber-400 transition-all space-y-2 relative"
                >
                  {/* LINHA 1: CÓDIGO DA COMANDA COM FONTE DOBRADA + NOME DE QUEM PEDIU EM MAIÚSCULO */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    
                    {/* P Ped-09 COM FONTE DOBRADA */}
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 font-mono tracking-tight">
                      {order.orderNumber}
                    </span>

                    <span className="text-2xl font-black text-slate-600 hidden sm:inline">—</span>

                    {/* NOME DE QUEM PEDIU EM MAIÚSCULO */}
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wide">
                      {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                    </span>
                  </div>

                  {/* LINHA 2: CATEGORIA + [VARIAÇÃO EM VERDE BOLD] : SABOR (LILÁS BRILHO BOLD) */}
                  <div className="pt-1">
                    {renderItemDetails(order)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUNA LATERAL: PEDIDOS ENTREGUES (SE HABILITADO) */}
        {tvSettings.showDelivered && (
          <section className="lg:col-span-4 flex flex-col bg-slate-900/85 rounded-3xl border-2 border-blue-500/40 p-5 shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between border-b-2 border-blue-500/30 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-blue-300 uppercase tracking-wider">
                    PEDIDOS ENTREGUES
                  </h2>
                  <p className="text-[11px] text-slate-400">Clientes que já retiraram</p>
                </div>
              </div>
              <span className="text-lg font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-0.5 rounded-xl font-mono">
                {deliveredOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {deliveredOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-8">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Nenhum pedido entregue ainda</p>
                </div>
              ) : (
                deliveredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-950/70 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="text-lg font-black text-blue-400 font-mono">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs font-bold text-slate-200 uppercase">
                        {order.customerName}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                      ✓ Entregue
                    </span>
                  </div>
                ))
              )}
            </div>

          </section>
        )}

      </main>

    </div>
  );
}
