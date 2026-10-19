import React, { useState, useEffect, useRef } from 'react';
import { 
  UtensilsCrossed, 
  Pizza, 
  IceCream, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  BellRing, 
  RotateCcw, 
  Flame, 
  Check, 
  Sparkles,
  User,
  Lock,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { storageService, resolveSpacingPx, resolveHeightPx } from '../services/storage';
import { soundService } from '../services/sound';
import ProfileSelector from './ProfileSelector';

export default function KitchenView({ environment, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' (Espera), 'entregue'
  const [soundEnabled, setSoundEnabled] = useState(() => storageService.getKitchenSettings().soundEnabled);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);
  const [screensLocked, setScreensLocked] = useState(() => storageService.isScreensLocked());

  // Escuta alterações na configuração de som e roteamento da cozinha
  const [productionRouting, setProductionRouting] = useState(() => storageService.getProductionRouting());
  const [systemSettings, setSystemSettings] = useState(() => storageService.getSystemSettings());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  useEffect(() => {
    const handleKitchenSettings = (e) => {
      if (e.detail?.soundEnabled !== undefined) {
        setSoundEnabled(e.detail.soundEnabled);
      }
    };
    const handleRoutingChange = (e) => {
      setProductionRouting(e.detail || storageService.getProductionRouting());
    };
    const handleLockChange = (e) => {
      setScreensLocked(!!e.detail);
    };
    const handleSystemChange = (e) => {
      setSystemSettings(e.detail || storageService.getSystemSettings());
    };
    window.addEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
    window.addEventListener('cantina_production_routing_changed', handleRoutingChange);
    window.addEventListener('cantina_screens_locked_changed', handleLockChange);
    window.addEventListener('cantina_system_settings_changed', handleSystemChange);
    return () => {
      window.removeEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
      window.removeEventListener('cantina_production_routing_changed', handleRoutingChange);
      window.removeEventListener('cantina_screens_locked_changed', handleLockChange);
      window.removeEventListener('cantina_system_settings_changed', handleSystemChange);
    };
  }, []);

  // Controle do efeito de 10 segundos no novo pedido
  const [newestOrderId, setNewestOrderId] = useState(null);
  const newestTimerRef = useRef(null);

  // Configuração dos tempos dos pedidos
  const [orderTimeLimits, setOrderTimeLimits] = useState(() => storageService.getOrderTimeLimits());

  useEffect(() => {
    const handleLimitsChange = (e) => {
      setOrderTimeLimits(e.detail || storageService.getOrderTimeLimits());
    };
    window.addEventListener('cantina_order_time_limits_changed', handleLimitsChange);
    return () => window.removeEventListener('cantina_order_time_limits_changed', handleLimitsChange);
  }, []);

  // Guardar IDs já tocados para não repetir som
  const knownOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Helper para verificar se o pedido é destinado para preparo neste ambiente/cozinha específico
  const isOrderForKitchen = (order) => {
    if (order.sendToKitchen === false || order.targetEnvironment === 'none') {
      return false;
    }

    const currentEnvId = environment?.id || 'COZINHA';

    // Se o pedido tiver multi-itens, checa se qualquer item pertence a esta cozinha
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.some(it => {
        if (it.targetEnvironment && it.targetEnvironment !== 'none') {
          return it.targetEnvironment === currentEnvId;
        }
        if (it.sendToKitchen === false) return false;
        const cat = String(it.categoryId || it.category || '').toLowerCase();
        if (currentEnvId === 'COZINHA') {
          return cat.includes('pizza');
        }
        return false;
      });
    }

    if (order.targetEnvironment) {
      return order.targetEnvironment === currentEnvId;
    }

    if (order.sendToKitchen === true) {
      return currentEnvId === 'COZINHA';
    }

    const targetId = order.variationId || order.itemId;
    if (targetId && productionRouting.destinationEnv?.[targetId]) {
      const dest = productionRouting.destinationEnv[targetId];
      if (dest === 'none') return false;
      return dest === currentEnvId;
    }
    if (targetId && productionRouting.sendToKitchen?.[targetId] !== undefined) {
      if (!productionRouting.sendToKitchen[targetId]) return false;
      return currentEnvId === 'COZINHA';
    }

    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (productionRouting.destinationEnv?.[cat]) {
      const dest = productionRouting.destinationEnv[cat];
      if (dest === 'none') return false;
      return dest === currentEnvId;
    }
    if (productionRouting.sendToKitchen?.[cat] !== undefined) {
      if (!productionRouting.sendToKitchen[cat]) return false;
      return currentEnvId === 'COZINHA';
    }

    return cat.includes('pizza') && (currentEnvId.includes('COZINHA') || currentEnvId.includes('PIZZA'));
  };

  // Relógio para atualizar cronômetros dos pedidos a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escutar pedidos em tempo real
  useEffect(() => {
    const unsubscribeOrders = storageService.subscribeOrders((allOrders) => {
      // Identificar novos pedidos para tocar o som e ativar o efeito de 10 segundos
      if (!isFirstLoadRef.current) {
        allOrders.forEach((order) => {
          if (!isOrderForKitchen(order)) return;

          if (!knownOrderIdsRef.current.has(order.id) && order.status === 'em_preparo') {
            knownOrderIdsRef.current.add(order.id);

            if (soundEnabled) {
              soundService.playCategorySound(order.category || order.orderNumber);
            }

            if (newestTimerRef.current) {
              clearTimeout(newestTimerRef.current);
            }
            setNewestOrderId(order.id);
            newestTimerRef.current = setTimeout(() => {
              setNewestOrderId(null);
            }, 10000);
          }
        });
      } else {
        allOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
        isFirstLoadRef.current = false;
      }

      setOrders(allOrders);
    });

    const unsubscribeStatus = storageService.onConnectionStatusChange((status) => {
      setIsFirebaseOnline(status);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeStatus();
      if (newestTimerRef.current) clearTimeout(newestTimerRef.current);
    };
  }, [soundEnabled, productionRouting]);

  // Normalização de itens para exibição no card
  const getOrderItems = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    return [{
      description: order.fullDescription || order.itemName || 'Item',
      quantity: order.quantity || 1,
      categoryId: order.category || order.categoryName || 'outros',
      unitPrice: order.unitPrice || order.totalPrice || 0
    }];
  };

  // Consolidação de pedidos do mesmo cliente em um único card com senha única
  const groupOrdersForDisplay = (list) => {
    if (!Array.isArray(list)) return [];
    const groups = [];
    const map = new Map();

    for (const ord of list) {
      const normName = (ord.customerName || '').trim().toUpperCase();
      const orderNum = (ord.orderNumber || '').trim();
      // Agrupa por cliente no mesmo intervalo de 30 minutos (ou pela mesma comanda)
      const timeSlot = Math.floor((new Date(ord.createdAt || 0).getTime()) / (30 * 60 * 1000));
      const groupKey = normName ? `${normName}_${timeSlot}` : (orderNum || ord.id);

      if (!map.has(groupKey)) {
        const consolidated = {
          ...ord,
          orderNumber: ord.orderNumber,
          customerName: ord.customerName,
          totalPrice: Number(ord.totalPrice) || 0,
          items: [...getOrderItems(ord)],
          orderIds: [ord.id]
        };
        map.set(groupKey, consolidated);
        groups.push(consolidated);
      } else {
        const existing = map.get(groupKey);
        existing.totalPrice += Number(ord.totalPrice) || 0;
        const newItems = getOrderItems(ord);
        existing.items.push(...newItems);
        existing.orderIds.push(ord.id);
      }
    }

    return groups;
  };

  // AÇÃO DE ENTREGAR
  const handleDeliver = async (order) => {
    try {
      const ids = order.orderIds || [order.id];
      if (newestOrderId && ids.includes(newestOrderId)) {
        setNewestOrderId(null);
      }
      setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'entregue', updatedAt: Date.now() } : o));
      for (const id of ids) {
        await storageService.updateOrderStatus(id, 'entregue');
      }
    } catch (err) {
      console.error('Erro ao entregar pedido:', err);
    }
  };

  const handleMarkReady = async (order) => {
    try {
      const ids = order.orderIds || [order.id];
      for (const id of ids) {
        await storageService.ringOrderBell(id);
      }
      soundService.playReadySound();
    } catch (e) {
      console.error('Erro ao acionar sino:', e);
    }
  };

  const handleReopen = async (order) => {
    const ids = order.orderIds || [order.id];
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'em_preparo', updatedAt: Date.now() } : o));
    for (const id of ids) {
      await storageService.updateOrderStatus(id, 'em_preparo');
    }
  };

  // Filtragem dos pedidos da COZINHA
  const kitchenOrders = orders.filter(isOrderForKitchen);
  const rawActive = kitchenOrders.filter(o => o.status === 'em_preparo' || o.status === 'pronto');
  const rawDelivered = kitchenOrders.filter(o => o.status === 'entregue');

  const activeOrders = groupOrdersForDisplay(rawActive);
  const deliveredOrders = groupOrdersForDisplay(rawDelivered);

  const displayedOrders = activeFilter === 'active'
    ? activeOrders
    : deliveredOrders;

  // Formatação de tempo decorrido no formato 0:00:00 (limite máximo de 9h, sem m e s)
  const getElapsedTimeParts = (timestamp) => {
    if (!timestamp) return { h: '0', m: '00', s: '00', hours: 0, text: '0:00:00' };
    const diffMs = currentTime - timestamp;
    if (diffMs < 0) return { h: '0', m: '00', s: '00', hours: 0, text: '0:00:00' };
    const totalSec = Math.floor(diffMs / 1000);
    // Limite máximo de 9 horas (9:59:59)
    const maxSec = 9 * 3600 + 59 * 60 + 59;
    const cappedSec = Math.min(totalSec, maxSec);

    const hours = Math.floor(cappedSec / 3600);
    const minutes = Math.floor((cappedSec % 3600) / 60);
    const seconds = cappedSec % 60;

    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    return {
      h: String(hours),
      m: mStr,
      s: sStr,
      hours,
      text: `${hours}:${mStr}:${sStr}`
    };
  };

  const getElapsedTime = (timestamp) => getElapsedTimeParts(timestamp).text;

  // Classificação de tempo por faixas configuradas: Verde -> Azul -> Amarelo -> Laranja -> Vermelho
  const getOrderTimeStatus = (order) => {
    const elapsedMinutes = Math.floor((currentTime - (order.createdAt || 0)) / 60000);
    const limits = orderTimeLimits || { greenLimit: 3, blueLimit: 6, yellowLimit: 10, orangeLimit: 15 };

    let severity = 0;
    if (elapsedMinutes < (limits.greenLimit || 3)) {
      severity = 0; // Verde (Normal)
    } else if (elapsedMinutes < (limits.blueLimit || 6)) {
      severity = 1; // Azul (No prazo)
    } else if (elapsedMinutes < (limits.yellowLimit || 10)) {
      severity = 2; // Amarelo (Alerta 1)
    } else if (elapsedMinutes < (limits.orangeLimit || 15)) {
      severity = 3; // Laranja (Atrasado)
    } else {
      severity = 4; // Vermelho (Muito Atrasado)
    }

    const colorConfigs = [
      {
        name: 'verde',
        label: 'Normal',
        borderLeftClass: 'border-l-emerald-500',
        classes: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50'
      },
      {
        name: 'azul',
        label: 'No prazo',
        borderLeftClass: 'border-l-sky-500',
        classes: 'text-sky-400 bg-sky-950/70 border-sky-500/50'
      },
      {
        name: 'amarelo',
        label: 'Alerta 1',
        borderLeftClass: 'border-l-amber-400',
        classes: 'text-amber-300 bg-amber-950/70 border-amber-500/50'
      },
      {
        name: 'laranja',
        label: 'Atrasado',
        borderLeftClass: 'border-l-orange-500',
        classes: 'text-orange-400 bg-orange-950/70 border-orange-500/50'
      },
      {
        name: 'vermelho',
        label: 'Muito Atrasado',
        borderLeftClass: 'border-l-rose-500',
        classes: 'text-rose-300 bg-rose-950/80 border-rose-500/80 animate-pulse font-black shadow-md shadow-rose-950/50'
      }
    ];

    return {
      ...colorConfigs[severity],
      severity
    };
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('pizza')) return <Pizza className="w-4 h-4 text-red-400" />;
    if (cat.includes('acai') || cat.includes('açaí')) return <IceCream className="w-4 h-4 text-purple-400" />;
    return <UtensilsCrossed className="w-4 h-4 text-amber-400" />;
  };



  // Cores de fundo e borda para cada categoria de item
  const getItemBadgeStyle = (categoryId, desc = '') => {
    const cat = String(categoryId || '').toLowerCase();
    const d = String(desc || '').toLowerCase();

    if (cat.includes('batata') || d.includes('batata') || d.includes('cone') || d.includes('cheddar')) {
      return 'bg-orange-950/70 border border-orange-500/50 text-orange-200';
    }
    if (cat.includes('acai') || cat.includes('açaí') || d.includes('açaí') || d.includes('acai')) {
      return 'bg-purple-950/70 border border-purple-500/50 text-purple-200';
    }
    if (cat.includes('pizza') || d.includes('pizza') || d.includes('pedaço') || d.includes('inteira') || d.includes('marguerita') || d.includes('calabresa')) {
      return 'bg-yellow-950/70 border border-yellow-500/50 text-yellow-200';
    }
    return 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200';
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* CABEÇALHO DA COZINHA (SELETOR À ESQUERDA + DESTINO DOS CAIXAS + ESPERA/ENTREGUES À DIREITA) */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 shadow-xl gap-3">
        {/* LADO ESQUERDO: SELETOR DE AMBIENTE */}
        <div className="flex items-center gap-3 flex-wrap">
          <ProfileSelector 
            title={environment?.name || 'COZINHA & PRODUÇÃO'}
            align="left"
            onProfileChange={(profileId) => {
              if (onNavigate) onNavigate(profileId);
            }}
          />
        </div>

        {/* LADO DIREITO: ESPERA E ENTREGUES + BOTÃO TELA CHEIA */}
        <div className="flex items-center gap-2 sm:gap-3">

          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-orange-500 text-slate-950 shadow-md ring-2 ring-orange-400/50'
                  : 'bg-slate-850 text-slate-400 hover:text-white'
              }`}
            >
              🔥 Espera ({activeOrders.length})
            </button>

            <button
              onClick={() => setActiveFilter('entregue')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeFilter === 'entregue'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                  : 'bg-slate-850 text-slate-400 hover:text-white'
              }`}
            >
              ✓ Entregues ({deliveredOrders.length})
            </button>
          </div>

          {/* BOTÃO TELA CHEIA */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-sm active:scale-95"
            title="Alternar Modo Tela Cheia"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline font-bold">
              {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================
          LISTA DOS PEDIDOS EM FORMATO DE LINHAS (ROW CARDS)
         ======================================================== */}
      <main className="flex-1 overflow-y-auto py-2 pl-3 sm:pl-4 pr-0 space-y-2">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 pr-3 sm:pr-4">
            <Flame className="w-14 h-14 text-slate-700 mb-2 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-400">
              {activeFilter === 'active' ? 'Nenhum pedido em espera!' : 'Nenhum pedido entregue nesta sessão!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assim que o caixa confirmar uma venda, ela surgirá aqui com aviso sonoro e destaque imediato.
            </p>
          </div>
        ) : (
          <div 
            className="flex flex-col w-full"
            style={{ gap: `${resolveSpacingPx(systemSettings?.kitchenCardSpacing, 6)}px` }}
          >
            {displayedOrders.map((order) => {
              const isReady = order.status === 'pronto';
              const isDelivered = order.status === 'entregue';
              const isPreparing = order.status === 'em_preparo';
              const isNewestHighlight = newestOrderId === order.id && !isDelivered;
              const itemsList = getOrderItems(order);
              const timeStatus = getOrderTimeStatus(order);

              return (
                <div
                  key={order.id}
                  style={{ minHeight: `${resolveHeightPx(systemSettings?.kitchenCardHeight, 52)}px` }}
                  className={`flex flex-col md:flex-row items-stretch md:items-center justify-between py-1 pl-2 pr-2.5 sm:pr-3 rounded-l-lg rounded-r-none border-y border-l-[5px] border-r-0 transition-all shadow-md gap-1 relative ${
                    isDelivered
                      ? 'bg-slate-900/40 border-slate-800 border-l-slate-600 opacity-60'
                      : isNewestHighlight
                        ? 'glow-new-order-line border-amber-400 border-l-amber-300'
                        : isReady
                          ? 'bg-emerald-950/40 border-emerald-500 border-l-emerald-400 shadow-emerald-500/10'
                          : `bg-slate-900/90 border-slate-700/80 ${timeStatus.borderLeftClass} hover:border-slate-600`
                  }`}
                >
                  {/* TAG PISCANTE DE NOVO PEDIDO (DURANTE OS 10 SEGUNDOS) */}
                  {isNewestHighlight && (
                    <div className="absolute -top-2 left-3 bg-purple-600 border border-purple-400/60 text-white font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-bounce z-10">
                      <Sparkles className="w-2.5 h-2.5 text-purple-200" />
                      <span>NOVO PEDIDO!</span>
                    </div>
                  )}

                  {/* BLOCO 1: NÚMERO DO PEDIDO ANTES DO NOME, NA MESMA LINHA */}
                  <div className="shrink-0 flex items-center gap-1.5 min-w-[105px] max-w-[210px]">
                    <span className="text-xs font-black text-orange-400 font-mono tracking-tight shrink-0 inline-flex items-center justify-center w-[6ch] text-center select-none">
                      {order.orderNumber}
                    </span>
                    {activeFilter !== 'active' && order.cashierTerminal && (
                      <span className="text-[8px] font-sans font-bold px-1 py-0 rounded bg-slate-800 text-slate-300 border border-slate-700 tracking-normal shrink-0">
                        {order.cashierTerminal}
                      </span>
                    )}
                    <span className="text-slate-600 font-bold select-none text-[10px] shrink-0">|</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-100 uppercase truncate" title={order.customerName}>
                      {order.customerName}
                    </span>
                  </div>

                  {/* BLOCO 2: TODOS OS PEDIDOS DO CLIENTE NO MESMO CARD (FONTE FINA E REDUZIDA NOS ITENS) */}
                  <div className="flex-1 bg-slate-950/70 px-1.5 py-0.2 rounded border border-slate-800/80 flex items-center gap-1 flex-wrap min-h-0">
                    {itemsList.map((it, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-1 py-0 rounded text-[9px] sm:text-[10px] font-normal leading-tight shadow-xs ${getItemBadgeStyle(it.categoryId || it.category, it.description || it.name)}`}
                      >
                        <span className="font-black text-orange-400 font-mono text-[9px] sm:text-[10px]">
                          {String(it.quantity).padStart(2, '0')}
                        </span>
                        <span className="font-normal text-slate-100 text-[9px] sm:text-[10px]">
                          {it.description || it.name || it.itemName}
                        </span>
                        {idx < itemsList.length - 1 && (
                          <span className="text-slate-400 font-normal ml-0.5 select-none text-[7px]">•</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* BLOCO 3: TEMPO + PRONTO (SINO) + ENTREGAR (ALTURA COMPACTADA EM 30%) */}
                  <div className="flex items-center justify-between md:justify-end gap-1.5 shrink-0">
                    {!isDelivered ? (
                      <div className="flex items-center gap-1.5">
                        {/* TEMPO BASEADO NAS CORES CONFIGURADAS (FORMATO 0:00:00 COM DESTAQUE DINÂMICO) */}
                        {(() => {
                          const timeParts = getElapsedTimeParts(order.createdAt);
                          const isOneHourOrMore = timeParts.hours >= 1;

                          return (
                            <div 
                              className={`w-[78px] h-[22px] pl-1.5 pr-1.5 rounded-lg border flex items-center justify-between font-mono text-[10px] tabular-nums transition-all shadow-sm shrink-0 select-none ${timeStatus.classes}`}
                              title={`Tempo em preparo: ${timeParts.text}`}
                            >
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <div className="leading-none flex items-baseline tracking-tight">
                                {/* HORA (Recebe BOLD e 10% maior quando completar 1h ou mais) */}
                                <span className={isOneHourOrMore ? 'font-black text-[11px]' : 'font-medium opacity-85 text-[10px]'}>
                                  {timeParts.h}
                                </span>
                                <span className="opacity-60 text-[9px] mx-[0.5px]">:</span>
                                {/* MINUTOS (Recebe BOLD e 10% maior enquanto for menos de 1h) */}
                                <span className={!isOneHourOrMore ? 'font-black text-[11px]' : 'font-medium opacity-85 text-[10px]'}>
                                  {timeParts.m}
                                </span>
                                <span className="opacity-60 text-[9px] mx-[0.5px]">:</span>
                                {/* SEGUNDOS */}
                                <span className="font-normal opacity-70 text-[10px]">
                                  {timeParts.s}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* PRONTO (SINO) */}
                        <button
                          onClick={() => handleMarkReady(order)}
                          className="w-[22px] h-[22px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 rounded-lg transition-all border border-slate-700 hover:border-amber-400/80 shadow-md flex items-center justify-center cursor-pointer"
                          title="Tocar sino e chamar no painel PEDIDOS"
                        >
                          <BellRing className="w-3 h-3 animate-bounce" />
                        </button>

                        {/* ENTREGAR */}
                        <button
                          onClick={() => handleDeliver(order)}
                          className="px-2 h-[22px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-[9px] rounded-lg transition-all shadow-md flex items-center gap-1 border border-emerald-400 cursor-pointer"
                          title="Entregar pedido concluído"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>ENTREGAR</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReopen(order)}
                        className="px-2 h-[22px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reabrir</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
