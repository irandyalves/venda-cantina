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
  User
} from 'lucide-react';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import ProfileSelector from './ProfileSelector';

export default function KitchenView({ environment, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' (Espera), 'entregue'
  const [soundEnabled, setSoundEnabled] = useState(() => storageService.getKitchenSettings().soundEnabled);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);

  // Escuta alterações na configuração de som e roteamento da cozinha
  const [productionRouting, setProductionRouting] = useState(() => storageService.getProductionRouting());

  useEffect(() => {
    const handleKitchenSettings = (e) => {
      if (e.detail?.soundEnabled !== undefined) {
        setSoundEnabled(e.detail.soundEnabled);
      }
    };
    const handleRoutingChange = (e) => {
      setProductionRouting(e.detail || storageService.getProductionRouting());
    };
    window.addEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
    window.addEventListener('cantina_production_routing_changed', handleRoutingChange);
    return () => {
      window.removeEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
      window.removeEventListener('cantina_production_routing_changed', handleRoutingChange);
    };
  }, []);

  // Controle do efeito de 10 segundos no novo pedido
  const [newestOrderId, setNewestOrderId] = useState(null);
  const newestTimerRef = useRef(null);

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
        if (currentEnvId.includes('COZINHA') || currentEnvId.includes('PIZZA')) {
          return cat.includes('pizza');
        }
        return true;
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

  // Formatação de tempo decorrido
  const getElapsedTime = (timestamp) => {
    const diffMs = currentTime - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
  };

  const getTimeColor = (timestamp) => {
    const min = Math.floor((currentTime - timestamp) / 60000);
    if (min < 5) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    if (min < 10) return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    return 'text-rose-400 bg-rose-950/60 border-rose-500/50 animate-pulse';
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
    if (cat.includes('acai') || cat.includes('açaí') || d.includes('açaí') || d.includes('acai') || d.includes('copo') || d.includes('tigela')) {
      return 'bg-purple-950/70 border border-purple-500/50 text-purple-200';
    }
    if (cat.includes('pizza') || d.includes('pizza') || d.includes('pedaço') || d.includes('inteira') || d.includes('marguerita') || d.includes('calabresa')) {
      return 'bg-yellow-950/70 border border-yellow-500/50 text-yellow-200';
    }
    return 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200';
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* CABEÇALHO DA COZINHA (COM BOTÕES ESPERA E ENTREGUES NO CABEÇALHO) */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-xl shadow-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide uppercase">
              {environment?.name || 'COZINHA & PRODUÇÃO'}
            </h1>
          </div>
        </div>

        {/* BOTÕES: FILA EM LINHA PASSA PARA ESPERA E ENTREGUES NO CABEÇALHO */}
        <div className="flex items-center gap-3">
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

          <ProfileSelector 
            onProfileChange={(profileId) => {
              if (onNavigate) onNavigate(profileId);
            }}
          />
        </div>
      </header>

      {/* ========================================================
          LISTA DOS PEDIDOS EM FORMATO DE LINHAS (ROW CARDS)
         ======================================================== */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <Flame className="w-14 h-14 text-slate-700 mb-2 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-400">
              {activeFilter === 'active' ? 'Nenhum pedido em espera!' : 'Nenhum pedido entregue nesta sessão!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assim que o caixa confirmar uma venda, ela surgirá aqui com aviso sonoro e destaque imediato.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-w-6xl mx-auto">
            {displayedOrders.map((order) => {
              const isReady = order.status === 'pronto';
              const isDelivered = order.status === 'entregue';
              const isPreparing = order.status === 'em_preparo';
              const isNewestHighlight = newestOrderId === order.id && !isDelivered;
              const itemsList = getOrderItems(order);

              return (
                <div
                  key={order.id}
                  className={`flex flex-col md:flex-row items-stretch md:items-center justify-between py-2 px-3 rounded-xl border-2 transition-all shadow-md gap-2.5 relative ${
                    isDelivered
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : isNewestHighlight
                        ? 'glow-new-order-line border-amber-400'
                        : isReady
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-500/10'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-orange-500/60'
                  }`}
                >
                  {/* TAG PISCANTE DE NOVO PEDIDO (DURANTE OS 10 SEGUNDOS) */}
                  {isNewestHighlight && (
                    <div className="absolute -top-2.5 left-3 bg-purple-600 border border-purple-400/60 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-bounce">
                      <Sparkles className="w-2.5 h-2.5 text-purple-200" />
                      <span>NOVO PEDIDO CHEGOU!</span>
                    </div>
                  )}

                  {/* BLOCO 1: SENHA ÚNICA GERAL + NOME DO CLIENTE */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                      {getCategoryIcon(order.category)}
                    </div>
                    <div>
                      {/* CÓDIGO DA SENHA ÚNICA */}
                      <div className="text-lg sm:text-xl font-black text-orange-400 font-mono tracking-tight flex items-center leading-none">
                        <span>{order.orderNumber}</span>
                      </div>
                      {/* NOME DO CLIENTE */}
                      <div className="text-xs font-black text-white flex items-center gap-1 leading-tight mt-0.5">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="uppercase truncate max-w-[130px]">{order.customerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 2: TODOS OS PEDIDOS DO CLIENTE NO MESMO CARD (01 Cone | 01 Copo 500ml | 01 Pedaço...) */}
                  <div className="flex-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 flex items-center gap-2 flex-wrap min-h-[42px]">
                    {itemsList.map((it, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${getItemBadgeStyle(it.categoryId || it.category, it.description || it.name)}`}
                      >
                        <span className="font-black text-orange-400 font-mono text-[13px]">
                          {String(it.quantity).padStart(2, '0')}
                        </span>
                        <span className="font-bold text-white">
                          {it.description || it.name || it.itemName}
                        </span>
                        {idx < itemsList.length - 1 && (
                          <span className="text-slate-400 font-black ml-1 select-none">•</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* BLOCO 3: TEMPO + PRONTO (SINO) + ENTREGAR */}
                  <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 shrink-0">
                    {!isDelivered ? (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* TEMPO */}
                        <div className={`text-[11px] font-mono font-bold px-2.5 h-[32px] rounded-lg border flex items-center justify-center gap-1 ${getTimeColor(order.createdAt)}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getElapsedTime(order.createdAt)}</span>
                        </div>

                        {/* PRONTO (SINO) */}
                        <button
                          onClick={() => handleMarkReady(order)}
                          className="w-[32px] h-[32px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 rounded-lg transition-all border border-slate-700 hover:border-amber-400/80 shadow-md flex items-center justify-center cursor-pointer"
                          title="Tocar sino e chamar no painel PEDIDOS"
                        >
                          <BellRing className="w-4 h-4 animate-bounce" />
                        </button>

                        {/* ENTREGAR */}
                        <button
                          onClick={() => handleDeliver(order)}
                          className="px-3.5 h-[32px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 border border-emerald-400 cursor-pointer"
                          title="Entregar pedido concluído"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>ENTREGAR</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReopen(order)}
                        className="px-3 h-[32px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
