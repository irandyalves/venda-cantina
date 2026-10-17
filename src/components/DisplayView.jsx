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
  const [deliveredModalOrder, setDeliveredModalOrder] = useState(null);
  
  // Configurações da TV vindas do Storage (definidas pelo Caixa)
  const [tvSettings, setTvSettings] = useState(storageService.getTVSettings());

  const prevBellTimestampsRef = useRef(new Map());
  const isFirstLoadRef = useRef(true);
  const deliveredModalTimerRef = useRef(null);

  // Escuta configurações da TV
  useEffect(() => {
    const handleSettingsChange = (e) => {
      setTvSettings(e.detail);
    };
    window.addEventListener('cantina_tv_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('cantina_tv_settings_changed', handleSettingsChange);
  }, []);

  // Desbloqueia o AudioContext no primeiro clique ou toque
  useEffect(() => {
    const unlockAudio = () => {
      soundService.getAudioContext();
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Limpa o timer do modal se desmontar
  useEffect(() => {
    return () => {
      if (deliveredModalTimerRef.current) clearTimeout(deliveredModalTimerRef.current);
    };
  }, []);

  // Fullscreen automático se configurado
  useEffect(() => {
    if (tvSettings.autoFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  }, [tvSettings.autoFullscreen]);

  // Função para acionar o modal central com som por exatamente 6 segundos
  const triggerDeliveredModal = (order) => {
    try {
      soundService.getAudioContext();
      if (tvSettings.soundEnabled !== false) {
        soundService.playDeliveredAlertSound();
      }
    } catch (e) {
      console.warn('Erro ao disparar som:', e);
    }

    setDeliveredModalOrder(order);

    if (deliveredModalTimerRef.current) {
      clearTimeout(deliveredModalTimerRef.current);
    }

    // 6 segundos, some sozinho e volta para os cards normais
    deliveredModalTimerRef.current = setTimeout(() => {
      setDeliveredModalOrder(null);
    }, 6000);
  };

  // Escutar pedidos em tempo real
  useEffect(() => {
    const unsubscribe = storageService.subscribeOrders((allOrders) => {
      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);

      // SÓ MOSTRAR O MODAL COM O CLIQUE NO SINO (NÃO MOSTRAR AO CLICAR EM ENTREGAR)
      if (!isFirstLoadRef.current) {
        const rungOrders = todayOrders.filter(o => {
          if (!o.bellRungAt) return false;
          const prevTime = prevBellTimestampsRef.current.get(o.id) || 0;
          return o.bellRungAt > prevTime;
        });

        if (rungOrders.length > 0) {
          rungOrders.sort((a, b) => (a.bellRungAt || 0) - (b.bellRungAt || 0));
          const latestRung = rungOrders[rungOrders.length - 1];
          triggerDeliveredModal(latestRung);
        }
      }

      // Registra os timestamps dos sinos já conhecidos
      todayOrders.forEach(o => {
        if (o.bellRungAt) {
          prevBellTimestampsRef.current.set(o.id, o.bellRungAt);
        }
      });

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

  // Pedidos em preparação continuam na tela até que sejam realmente entregues
  const preparingOrders = orders.filter(o => o.status === 'em_preparo' || o.status === 'pronto');
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
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden select-none relative">
      
      {/* CABEÇALHO DA TV */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl shadow-lg">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              PEDIDOS
            </h1>
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

      {/* ========================================================
          MODAL CENTRAL QUANDO UM PEDIDO FOR ENTREGUE PELA COZINHA
          - PISCA NO CENTRO DA TELA COM SOM
          - PEDIDO (GRANDE)
          - NOME DA PESSOA
          - O QUE PEDIU
          - DURAÇÃO: 6 SEGUNDOS, SOME E VOLTA PARA OS CARDS
         ======================================================== */}
      {deliveredModalOrder && (
        <div 
          onClick={() => setDeliveredModalOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-10 text-center shadow-[0_0_120px_rgba(245,158,11,0.85)] animate-modal-delivered space-y-6 relative overflow-hidden"
          >
            {/* BARRA DE PROGRESSO DE 6 SEGUNDOS */}
            <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-progress-6s" />

            {/* SELO SUPERIOR */}
            <div className="flex items-center justify-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                <Sparkles className="w-6 h-6" />
              </span>
              <span className="text-base sm:text-lg md:text-xl uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/80 px-6 py-1.5 rounded-full border border-emerald-500/50 shadow">
                PEDIDO Nº
              </span>
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                <Sparkles className="w-6 h-6" />
              </span>
            </div>

            {/* 1. NÚMERO DO PEDIDO (GRANDE) */}
            <div>
              <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_40px_rgba(251,191,36,0.9)] animate-pulse">
                {deliveredModalOrder.orderNumber}
              </div>
            </div>

            {/* 2. NOME DA PESSOA */}
            <div className="py-4 px-4 border-y-2 border-slate-800/80 bg-slate-900/70 rounded-2xl">
              <div className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]">
                {deliveredModalOrder.customerName ? deliveredModalOrder.customerName.toUpperCase() : 'CLIENTE'}
              </div>
            </div>

            {/* 3. O QUE PEDIU */}
            <div className="flex items-center justify-center pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-purple-200 bg-purple-950/80 px-6 py-3.5 rounded-2xl border-2 border-purple-500/60 shadow-lg drop-shadow-[0_0_20px_rgba(216,180,254,0.7)]">
                {renderItemDetails(deliveredModalOrder)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          ÁREA PRINCIPAL: EM PREPARAÇÃO CENTRALIZADO
          - BORDAS ESQUERDA E DIREITA RETIRADAS DOS CARDS
          - LINHAS SUPERIOR E INFERIOR ENCOSTAM NA BORDA DA SEÇÃO
         ======================================================== */}
      <main className={`flex-1 px-0 py-3 sm:py-4 overflow-hidden ${
        tvSettings.showDelivered 
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6' 
          : 'flex flex-col items-center justify-center px-4'
      }`}>
        
        {/* COLUNA CENTRAL: EM PREPARAÇÃO (SEM BORDA ESQ, LINHAS SUP/INF ENCOSTAM NA JANELA, BORDA GROSSA À DIREITA) */}
        <section className={`flex flex-col bg-slate-900/85 rounded-l-none rounded-r-3xl border-y-2 border-l-0 border-r-[6px] border-amber-500/60 border-r-amber-400 shadow-[4px_0_24px_rgba(245,158,11,0.25)] overflow-hidden ${
          tvSettings.showDelivered ? 'lg:col-span-7' : 'w-full max-w-5xl h-full'
        }`}>
          
          {/* CABEÇALHO DA SEÇÃO EM PREPARAÇÃO */}
          <div className="flex items-center justify-between border-b-2 border-amber-500/40 p-5 pl-6 sm:pl-8 pb-4 shrink-0 bg-slate-900/90">
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

            <span className="text-2xl font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-1 rounded-2xl font-mono mr-2">
              {preparingOrders.length}
            </span>
          </div>

          {/* LISTA DE CARDS: AS LINHAS SUPERIOR E INFERIOR ENCOSTAM NA BORDA DA SEÇÃO (SEM BORDAS ESQ E DIR) */}
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-12 px-5">
                <Clock className="w-14 h-14 mb-2 opacity-40 animate-pulse" />
                <p className="text-base font-bold text-slate-400">Nenhum pedido em preparo no momento</p>
                <p className="text-xs text-slate-600 mt-1">Os novos pedidos do caixa aparecerão aqui automaticamente</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="w-full bg-slate-950/90 px-6 sm:px-8 py-4 sm:py-5 border-y-2 border-amber-500/60 border-x-0 rounded-none shadow-xl hover:bg-slate-900/95 transition-all space-y-2 relative"
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

        {/* COLUNA LATERAL: ENTREGUES (SEM BORDA DIR, LINHAS SUP/INF ENCOSTAM NA JANELA, BORDA GROSSA À ESQUERDA) */}
        {tvSettings.showDelivered && (
          <section className="lg:col-span-5 flex flex-col bg-slate-900/85 rounded-r-none rounded-l-3xl border-y-2 border-r-0 border-l-[6px] border-blue-500/50 border-l-blue-400 shadow-[-4px_0_24px_rgba(59,130,246,0.25)] overflow-hidden">
            
            <div className="flex items-center justify-between border-b-2 border-blue-500/30 p-5 pr-6 sm:pr-8 pb-4 shrink-0 bg-slate-900/90 ml-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-blue-300 uppercase tracking-wider">
                    ENTREGUES
                  </h2>
                </div>
              </div>
              <span className="text-lg font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-0.5 rounded-xl font-mono">
                {deliveredOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {deliveredOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-8 px-4">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Nenhum pedido entregue ainda</p>
                </div>
              ) : (
                deliveredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="w-full bg-slate-950/70 px-5 py-3 border-y border-blue-500/40 border-x-0 rounded-none flex items-center justify-between shadow-sm"
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
