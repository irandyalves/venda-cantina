import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Flame,
  Bell,
  Lock,
  ArrowRight
} from 'lucide-react';
import { storageService, resolveSpacingPx, resolveHeightPx } from '../services/storage';
import { soundService } from '../services/sound';
import { authService } from '../services/auth';
import ProfileSelector from './ProfileSelector';
import AnalogClock from './AnalogClock';

export default function DisplayView({ environment, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deliveredModalOrder, setDeliveredModalOrder] = useState(null);
  const [screensLocked, setScreensLocked] = useState(() => storageService.isScreensLocked());
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('pt-BR', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Configurações da TV vindas do Storage (definidas pelo Caixa)
  const [tvSettings, setTvSettings] = useState(storageService.getTVSettings());
  const [systemSettings, setSystemSettings] = useState(() => storageService.getSystemSettings());

  const prevBellTimestampsRef = useRef(new Map());
  const isFirstLoadRef = useRef(true);
  const deliveredModalTimerRef = useRef(null);

  // Escuta configurações da TV e do Sistema
  useEffect(() => {
    const handleSettingsChange = (e) => {
      setTvSettings(e.detail);
    };
    const handleLockChange = (e) => {
      setScreensLocked(!!e.detail);
    };
    const handleSystemChange = (e) => {
      setSystemSettings(e.detail || storageService.getSystemSettings());
    };
    window.addEventListener('cantina_tv_settings_changed', handleSettingsChange);
    window.addEventListener('cantina_screens_locked_changed', handleLockChange);
    window.addEventListener('cantina_system_settings_changed', handleSystemChange);
    return () => {
      window.removeEventListener('cantina_tv_settings_changed', handleSettingsChange);
      window.removeEventListener('cantina_screens_locked_changed', handleLockChange);
      window.removeEventListener('cantina_system_settings_changed', handleSystemChange);
    };
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

  // Função para acionar o modal central com som pelo tempo configurado no sistema
  const triggerDeliveredModal = (order) => {
    try {
      soundService.getAudioContext();
      if (tvSettings.soundEnabled !== false && systemSettings?.cardSoundEnabled !== false) {
        soundService.playDeliveredAlertSound();
      }
    } catch (e) {
      console.warn('Erro ao disparar som:', e);
    }

    setDeliveredModalOrder(order);

    if (deliveredModalTimerRef.current) {
      clearTimeout(deliveredModalTimerRef.current);
    }

    const durationSec = Math.max(2, Number(systemSettings?.callPasswordDuration || 6));
    deliveredModalTimerRef.current = setTimeout(() => {
      setDeliveredModalOrder(null);
    }, durationSec * 1000);
  };

  const linkedKitchenId = environment?.linkedKitchen;
  const displayScopeName = (() => {
    if (linkedKitchenId) {
      try {
        const envs = authService.getEnvironments();
        const matched = envs.find(e => e.id === linkedKitchenId);
        if (matched) return matched.name;
      } catch (_) {}
      return linkedKitchenId;
    }
    return 'Todas as Cozinhas';
  })();

  // Verifica se o pedido pertence a este Painel TV
  const isOrderForThisDisplay = (order) => {
    // 1. Checa se o item está configurado para aparecer na TV
    if (!isOrderForTV(order)) return false;

    // 2. Se esta TV estiver vinculada a uma cozinha específica, filtra só pedidos dessa cozinha
    if (linkedKitchenId) {
      return order.targetEnvironment === linkedKitchenId;
    }

    // Caso contrário, é Painel TV Geral (mostra de todas as cozinhas)
    return true;
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
          // FILTRO EXCLUSIVO: Só toca o sino e abre o modal nesta TV se o pedido pertencer a ela!
          if (!isOrderForThisDisplay(o)) return false;
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
  }, [tvSettings.soundEnabled, linkedKitchenId]);

  const [productionRouting, setProductionRouting] = useState(() => storageService.getProductionRouting());

  useEffect(() => {
    const handleRoutingChange = (e) => {
      setProductionRouting(e.detail || storageService.getProductionRouting());
    };
    window.addEventListener('cantina_production_routing_changed', handleRoutingChange);
    return () => window.removeEventListener('cantina_production_routing_changed', handleRoutingChange);
  }, []);

  const isOrderForTV = (order) => {
    if (order.showOnTV === false) return false;
    if (order.showOnTV === true) return true;

    const targetId = order.variationId || order.itemId;
    if (targetId && productionRouting.showOnTV?.[targetId] !== undefined) {
      return productionRouting.showOnTV[targetId];
    }
    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (productionRouting.showOnTV?.[cat] !== undefined) {
      return productionRouting.showOnTV[cat];
    }
    return cat.includes('pizza');
  };

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

  // Pedidos destinados ao Painel TV (filtrados exclusivamente se vinculado a uma cozinha)
  const tvOrders = orders.filter(isOrderForThisDisplay);
  const preparingOrders = tvOrders.filter(o => o.status === 'em_preparo');
  const readyOrders = tvOrders.filter(o => o.status === 'pronto');
  const deliveredOrders = tvOrders.filter(o => o.status === 'entregue').slice(0, 20);

  // Helper para formatar o resumo limpo do pedido em fonte branca com pontinhos:
  // Ex: "PIZZA INTEIRA....."
  const formatOrderSummary = (order) => {
    const items = order.items && Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [order];
      
    const first = items[0] || {};
    const cat = (first.categoryName || first.category || '').toUpperCase();
    const varName = (first.variationName || '').toUpperCase();
    const name = (first.itemName || first.name || '').toUpperCase();
    
    let desc = '';
    if (cat.includes('PIZZA')) {
      desc = `PIZZA ${varName ? `${varName}` : name}`;
    } else {
      const qtyStr = first.quantity && first.quantity > 1 ? `${first.quantity}X ` : '';
      desc = `${qtyStr}${name || cat}${varName ? ` ${varName}` : ''}`;
    }
    
    return `${desc.trim()}.....`;
  };

  // Helper para formatar o texto do item conforme o padrão solicitado:
  // Ex: PIZZA [PEDAÇO (verde bold)] : MARGUERITTA (lilás brilho bold)
  const renderItemDetails = (order) => {
    // Se o pedido tiver múltiplos itens na comanda
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
          {order.items.map((it, idx) => {
            const cat = (it.categoryName || it.category || '').toUpperCase();
            const varName = (it.variationName || '').toUpperCase();
            const name = (it.itemName || it.name || '').toUpperCase();
            const qty = it.quantity || 1;
            return (
              <span key={idx} className="inline-flex items-center gap-1">
                {idx > 0 && <span className="text-slate-500 font-bold">+</span>}
                <span className="font-black text-slate-200 tracking-wide">{qty > 1 ? `${qty}x ` : ''}{cat || name}</span>
                {varName && (
                  <span className="text-emerald-400 font-black bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/50 text-[10px] sm:text-xs shadow-sm">
                    [{varName}]
                  </span>
                )}
                {cat && name && cat !== name && (
                  <>
                    <span className="text-slate-400 font-bold">:</span>
                    <span className="text-purple-300 font-black tracking-wider uppercase drop-shadow-[0_0_8px_rgba(216,180,254,0.7)] text-xs sm:text-sm">
                      {name}
                    </span>
                  </>
                )}
              </span>
            );
          })}
        </div>
      );
    }

    const categoryName = (order.categoryName || order.category || 'ITEM').toUpperCase();
    const variationName = (order.variationName || '').toUpperCase();
    const itemName = (order.itemName || '').toUpperCase();

    // Se tiver variação explícita (como PEDAÇO ou INTEIRA na pizza)
    if (variationName) {
      return (
        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
          <span className="font-black text-slate-200 tracking-wide">{categoryName}</span>
          <span className="text-emerald-400 font-black bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/50 text-[10px] sm:text-xs shadow-sm">
            [{variationName}]
          </span>
          <span className="text-slate-400 font-bold">:</span>
          <span className="text-purple-300 font-black tracking-wider uppercase drop-shadow-[0_0_8px_rgba(216,180,254,0.7)] text-xs sm:text-sm">
            {itemName}
          </span>
        </div>
      );
    }

    // Se for Açaí ou Batata
    return (
      <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
        <span className="font-black text-slate-200 tracking-wide">{categoryName}</span>
        <span className="text-emerald-400 font-black bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/50 text-[10px] sm:text-xs shadow-sm">
          [{itemName}]
        </span>
      </div>
    );
  };

  const displaySpacingClass = {
    compact: 'space-y-1',
    normal: 'space-y-1.5',
    relaxed: 'space-y-2.5',
    spacious: 'space-y-4'
  }[systemSettings?.displayCardSpacing || 'normal'] || 'space-y-1.5';

  const displayCardH = resolveHeightPx(systemSettings?.displayCardHeight, 64);
  const displayCardPadY = displayCardH <= 50 ? 'py-1' : displayCardH <= 68 ? 'py-1.5' : 'py-2 sm:py-2.5';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden select-none relative">
      
      {/* CABEÇALHO DA TV */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg gap-4">
        {/* LADO ESQUERDO: SELETOR DE AMBIENTE + RECEBE PEDIDOS DO */}
        <div className="flex items-center gap-3 flex-wrap">
          <ProfileSelector 
            title="PAINEL TELÃO"
            align="left"
            onProfileChange={(profileId) => {
              if (onNavigate) onNavigate(profileId);
            }}
          />

          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-emerald-400 text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1">
              Mostra <ArrowRight className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" /> os pedidos de
            </span>
            <span className="bg-black text-white text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg border border-slate-700 shadow-sm whitespace-nowrap">
              {displayScopeName}
            </span>
          </div>
        </div>

        {/* HORA LOCAL NO CENTRO: RELÓGIO ANALÓGICO À ESQ + HORA DIGITAL (+50%) */}
        <div className="flex-1 flex justify-center items-center px-2">
          <div className="flex items-center gap-2.5 select-none">
            {/* RELÓGIO ANALÓGICO COM FUNDO BRANCO E SEGUNDO VERMELHO (CÍRCULO PERFEITO) */}
            <div className="w-[34px] h-[34px] shrink-0 aspect-square flex items-center justify-center drop-shadow-md hover:scale-105 transition-transform" title="Relógio analógico em tempo real">
              <AnalogClock size={34} />
            </div>

            {/* CAIXA HORA DIGITAL (FUNDO PRETO, FONTE BRANCA AUMENTADA EM 50%) */}
            <div className="bg-black text-white px-4 py-1 rounded-xl font-mono font-black text-base sm:text-lg md:text-xl tracking-widest border border-slate-800 shadow-inner flex items-center">
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* CONTROLES À DIREITA: TELA CHEIA */}
        <div className="flex items-center gap-3 shrink-0">

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Alternar Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>
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
            {/* BARRA DE PROGRESSO COM DURAÇÃO CONFIGURADA */}
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-modal-progress" 
              style={{
                animationDuration: `${Math.max(2, Number(systemSettings?.callPasswordDuration || 6))}s`
              }}
            />

            {/* SELO SUPERIOR / CAPTION: 'SENHA' */}
            <div className="flex items-center justify-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-full animate-bounce">
                <Sparkles className="w-6 h-6" />
              </span>
              <span className="text-xl sm:text-2xl md:text-3xl uppercase font-black tracking-widest text-amber-300 bg-amber-950/80 px-8 py-2 rounded-full border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                SENHA
              </span>
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-full animate-bounce">
                <Sparkles className="w-6 h-6" />
              </span>
            </div>

            {/* 1. EMBAIXO A SENHA PROPRIAMENTE DITA */}
            <div>
              <div className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_50px_rgba(251,191,36,0.95)] animate-pulse">
                {deliveredModalOrder.orderNumber}
              </div>
            </div>

            {/* 2. NOME DA PESSOA */}
            <div className="py-4 px-4 border-y-2 border-slate-800/80 bg-slate-900/70 rounded-2xl">
              <div className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]">
                {deliveredModalOrder.customerName ? deliveredModalOrder.customerName.toUpperCase() : 'CLIENTE'}
              </div>
            </div>

            {/* 3. E O PEDIDO */}
            <div className="flex items-center justify-center pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-purple-200 bg-purple-950/80 px-6 py-3.5 rounded-2xl border-2 border-purple-500/60 shadow-lg drop-shadow-[0_0_20px_rgba(216,180,254,0.7)]">
                {renderItemDetails(deliveredModalOrder)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          ÁREA PRINCIPAL: 3 COLUNAS
          1. EM PREPARAÇÃO (Âmbar)
          2. PRONTOS - RETIRAR (Verde / Esmeralda)
          3. ENTREGUES (Azul)
          - CARDS: LINHAS SUP/INF ENCOSTAM NAS BORDAS DO CONTAINER
         ======================================================== */}
      <main className="flex-1 p-2 sm:p-3 md:p-4 overflow-hidden min-h-0">
        <div className={`grid gap-2.5 sm:gap-3 md:gap-4 h-full min-h-0 ${
          tvSettings.showDelivered 
            ? 'grid-cols-1 md:grid-cols-[1.3fr_0.85fr_0.85fr]' 
            : 'grid-cols-1 md:grid-cols-[1.3fr_0.7fr]'
        }`}>
          
          {/* COLUNA 1: EM PREPARAÇÃO (AUMENTADA EM 30%) */}
          <section className="flex flex-col bg-slate-900/85 rounded-2xl border-2 border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.2)] overflow-hidden h-full min-h-0">
            {/* CABEÇALHO */}
            <div className="flex items-center justify-between border-b-2 border-amber-500/40 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0 bg-slate-900/95">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-400 animate-spin-pulse-green-glow" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-widest leading-tight">
                    EM PREPARAÇÃO
                  </h2>
                  <p className="text-[10px] text-slate-400">Na cozinha sendo preparado</p>
                </div>
              </div>

              <span className="text-base sm:text-lg font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-xl font-mono">
                {preparingOrders.length}
              </span>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div 
              className="flex-1 overflow-y-auto flex flex-col py-1 min-h-0"
              style={{ gap: `${resolveSpacingPx(systemSettings?.displayCardSpacing, 6)}px` }}
            >
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-8 px-4">
                  <Clock className="w-10 h-10 mb-2 opacity-40 animate-pulse text-amber-500" />
                  <p className="text-xs sm:text-sm font-bold text-slate-400">Nenhum pedido em preparo</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Os novos pedidos do caixa aparecerão aqui</p>
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{ minHeight: `${displayCardH}px` }}
                    className={`w-full bg-slate-950/90 px-3 sm:px-4 ${displayCardPadY} border-y border-amber-500/50 border-x-0 rounded-none shadow-md hover:bg-slate-900/95 transition-all flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden flex-1">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-400 font-mono tracking-tight shrink-0 w-[8ch] text-left">
                        {order.orderNumber}
                      </span>

                      <span className="text-amber-400 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-wide truncate shrink-0 max-w-[38%]">
                        {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      <span className="text-amber-400 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                      <span className="text-sm sm:text-base md:text-lg font-bold text-white uppercase tracking-wider truncate">
                        {formatOrderSummary(order)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUNA 2: PRONTOS (RETIRAR) */}
          <section className="flex flex-col bg-slate-900/85 rounded-2xl border-2 border-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.25)] overflow-hidden h-full min-h-0">
            {/* CABEÇALHO */}
            <div className="flex items-center justify-between border-b-2 border-emerald-500/40 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0 bg-slate-900/95">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-emerald-300 uppercase tracking-widest leading-tight">
                    PRONTOS
                  </h2>
                  <p className="text-[10px] text-slate-400">Aguardando retirada no balcão</p>
                </div>
              </div>

              <span className="text-base sm:text-lg font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-xl font-mono">
                {readyOrders.length}
              </span>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div 
              className="flex-1 overflow-y-auto flex flex-col py-1 min-h-0"
              style={{ gap: `${resolveSpacingPx(systemSettings?.displayCardSpacing, 6)}px` }}
            >
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-8 px-4">
                  <Bell className="w-10 h-10 mb-2 opacity-40 animate-pulse text-emerald-500" />
                  <p className="text-xs sm:text-sm font-bold text-slate-400">Nenhum pedido pronto para retirar</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Quando a cozinha finalizar, o pedido virá para cá</p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{ minHeight: `${displayCardH}px` }}
                    className={`w-full bg-emerald-950/30 px-3 sm:px-4 ${displayCardPadY} border-y border-emerald-500/60 border-x-0 rounded-none shadow-md hover:bg-emerald-950/50 transition-all flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden flex-1">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-400 font-mono tracking-tight shrink-0 w-[8ch] text-left">
                        {order.orderNumber}
                      </span>

                      <span className="text-emerald-400 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-wide truncate shrink-0 max-w-[55%]">
                        {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      <span className="text-emerald-400 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                      <span className="text-sm sm:text-base md:text-lg font-bold text-white uppercase tracking-wider truncate">
                        {formatOrderSummary(order)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUNA 3: ENTREGUES */}
          {tvSettings.showDelivered && (
            <section className="flex flex-col bg-slate-900/85 rounded-2xl border-2 border-blue-500/60 shadow-[0_0_24px_rgba(59,130,246,0.2)] overflow-hidden h-full min-h-0">
              {/* CABEÇALHO */}
              <div className="flex items-center justify-between border-b-2 border-blue-500/30 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0 bg-slate-900/95">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-blue-300 uppercase tracking-wider leading-tight">
                      ENTREGUES
                    </h2>
                    <p className="text-[10px] text-slate-400">Últimos pedidos entregues</p>
                  </div>
                </div>

                <span className="text-base sm:text-lg font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-xl font-mono">
                  {deliveredOrders.length}
                </span>
              </div>

              {/* LISTA DE PEDIDOS */}
              <div 
                className="flex-1 overflow-y-auto flex flex-col py-1 min-h-0"
                style={{ gap: `${resolveSpacingPx(systemSettings?.displayCardSpacing, 6)}px` }}
              >
                {deliveredOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-6 px-4">
                    <CheckCircle2 className="w-8 h-8 mb-1.5 opacity-30 text-blue-500" />
                    <p className="text-[11px] font-semibold text-slate-400">Nenhum pedido entregue ainda</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Histórico dos pedidos já retirados</p>
                  </div>
                ) : (
                  deliveredOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{ minHeight: `${displayCardH}px` }}
                      className={`w-full bg-blue-950/20 px-3 sm:px-4 ${displayCardPadY} border-y border-blue-500/30 border-x-0 rounded-none shadow-sm hover:bg-blue-950/35 transition-all flex items-center justify-between gap-2 opacity-80 hover:opacity-100`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden flex-1">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-400/85 font-mono tracking-tight shrink-0 w-[8ch] text-left">
                          {order.orderNumber}
                        </span>

                        <span className="text-blue-400/50 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                        <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-300 uppercase tracking-wide truncate shrink-0 max-w-[55%]">
                          {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                        </span>

                        <span className="text-blue-400/50 text-lg sm:text-xl md:text-2xl font-black select-none shrink-0">•</span>

                        <span className="text-sm sm:text-base md:text-lg font-bold text-slate-300 uppercase tracking-wider truncate">
                          {formatOrderSummary(order)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

        </div>
      </main>

    </div>
  );
}
