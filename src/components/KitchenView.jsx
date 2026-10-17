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
  Trash2
} from 'lucide-react';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import ProfileSelector from './ProfileSelector';

export default function KitchenView({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active'); // 'active', 'entregue', 'all'
  const [soundEnabled, setSoundEnabled] = useState(() => storageService.getKitchenSettings().soundEnabled);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);

  // Escuta alterações na configuração de som da cozinha (vindas do modal de configurações)
  useEffect(() => {
    const handleKitchenSettings = (e) => {
      if (e.detail?.soundEnabled !== undefined) {
        setSoundEnabled(e.detail.soundEnabled);
      }
    };
    window.addEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
    return () => window.removeEventListener('cantina_kitchen_settings_changed', handleKitchenSettings);
  }, []);

  // Controle do efeito de 10 segundos no novo pedido
  const [newestOrderId, setNewestOrderId] = useState(null);
  const newestTimerRef = useRef(null);

  // Guardar IDs já tocados para não repetir som
  const knownOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

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
          if (!knownOrderIdsRef.current.has(order.id) && order.status === 'em_preparo') {
            knownOrderIdsRef.current.add(order.id);

            // Toca som específico: Pizza, Batata ou Açaí
            if (soundEnabled) {
              soundService.playCategorySound(order.category || order.orderNumber);
            }

            // ATIVA O EFEITO DE 10 SEGUNDOS (SUBSTITUI SE JÁ TIVER OUTRO)
            if (newestTimerRef.current) {
              clearTimeout(newestTimerRef.current);
            }
            setNewestOrderId(order.id);
            newestTimerRef.current = setTimeout(() => {
              setNewestOrderId(null);
            }, 10000); // 10 segundos
          }
        });
      } else {
        // Na primeira carga, memoriza os existentes sem apitar
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
  }, [soundEnabled]);

  // AÇÃO DE ENTREGAR (GARANTINDO CONCLUSÃO IMEDIATA)
  const handleDeliver = async (orderId) => {
    try {
      // Se for o que estava com o efeito, limpa
      if (newestOrderId === orderId) {
        setNewestOrderId(null);
      }

      // Atualiza no estado local de imediato para sumir na hora da fila
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'entregue', updatedAt: Date.now() } : o));

      // Atualiza no Cloud Firestore
      await storageService.updateOrderStatus(orderId, 'entregue');
    } catch (err) {
      console.error('Erro ao entregar pedido:', err);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await storageService.ringOrderBell(orderId);
      soundService.playReadySound();
    } catch (e) {
      console.error('Erro ao acionar sino:', e);
    }
  };

  const handleReopen = async (orderId) => {
    await storageService.updateOrderStatus(orderId, 'em_preparo');
  };

  // Filtragem dos pedidos
  const activeOrders = orders.filter(o => o.status === 'em_preparo' || o.status === 'pronto');
  const deliveredOrders = orders.filter(o => o.status === 'entregue');

  const displayedOrders = activeFilter === 'active'
    ? activeOrders
    : activeFilter === 'entregue'
      ? deliveredOrders
      : orders;

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

  const getItemCleanDescription = (order) => {
    const isPizza = order.category === 'pizza' || order.categoryName?.toUpperCase() === 'PIZZA';
    if (isPizza) {
      const varName = (order.variationName || '').toUpperCase();
      if (varName && order.itemName) {
        return `${varName}: ${order.itemName}`;
      }
      if (order.fullDescription) {
        return order.fullDescription.replace(/^pizza\s+/i, '');
      }
      return order.itemName;
    }

    if (order.fullDescription) {
      return order.fullDescription.replace(/^(açaí|acai|batata)\s+/i, '');
    }
    return order.itemName;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* CABEÇALHO DA COZINHA */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-xl shadow-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide">
              COZINHA & PRODUÇÃO
            </h1>
          </div>
        </div>

        {/* CONTROLES LIMPOS: SELETOR DE PERFIL */}
        <div className="flex items-center gap-2.5">
          {/* PERFIL NO CANTO SUPERIOR DIREITO */}
          <ProfileSelector 
            onProfileChange={(profile) => {
              if (profile === 'ADMIN') onNavigate('cashier');
              else if (profile === 'PUBLICO') onNavigate('display');
            }}
          />
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1 rounded-lg font-black transition-all ${
              activeFilter === 'active'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 Fila em Linhas ({activeOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('entregue')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeFilter === 'entregue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ✓ Entregues ({deliveredOrders.length})
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Deseja limpar todos os pedidos e o cache da fila da Cozinha e do Painel? Todos os pedidos antigos serão removidos.')) {
                await storageService.clearAllOrders();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/50 rounded-lg border border-slate-700 transition-colors"
            title="Limpar todos os pedidos da fila e do painel TV"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Fila / Cache</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          LISTA DOS PEDIDOS EM FORMATO DE LINHAS (ROW CARDS)
         ======================================================== */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <Flame className="w-14 h-14 text-slate-700 mb-2 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-400">Nenhum pedido pendente na cozinha!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Assim que o caixa confirmar uma venda, ela surgirá aqui com o efeito de 10 segundos e o aviso sonoro.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-6xl mx-auto">
            {displayedOrders.map((order) => {
              const isReady = order.status === 'pronto';
              const isDelivered = order.status === 'entregue';
              const isPreparing = order.status === 'em_preparo';
              
              // Verifica se este pedido é o mais novo que está com o efeito de 10 segundos
              const isNewestHighlight = newestOrderId === order.id && !isDelivered;

              return (
                <div
                  key={order.id}
                  className={`flex flex-col md:flex-row items-stretch md:items-center justify-between py-1.5 px-3 rounded-xl border-2 transition-all shadow-md gap-2 relative ${
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

                  {/* BLOCO 1: NÚMERO DA COMANDA + NOME DO CLIENTE (COMPACTADO PARA PUXAR O MEIO PARA A ESQUERDA) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                      {getCategoryIcon(order.category)}
                    </div>
                    <div>
                      {/* CÓDIGO DA COMANDA */}
                      <div className="text-base sm:text-lg font-black text-orange-400 font-mono tracking-tight flex items-center leading-none">
                        <span>{order.orderNumber}</span>
                      </div>
                      {/* NOME DO CLIENTE REDUZIDO EM 25% (text-[10.5px]) */}
                      <div className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1 leading-tight mt-0.5">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[95px]">{order.customerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 2: DETALHES DO PRODUTO (LARGURA EXPANDIDA PARA A ESQUERDA) */}
                  <div className="flex-1 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800/80 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider leading-none">
                        {order.categoryName}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-slate-400 font-mono text-[10px] leading-none">
                          {order.paymentMethod}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-orange-500/20 text-orange-300 font-black px-1.5 py-0.5 rounded border border-orange-500/40 text-[10px] shrink-0 leading-none">
                        QTE: {String(order.quantity).padStart(2, '0')}
                      </span>
                      <span className="text-sm sm:text-base font-black text-white leading-tight">
                        {getItemCleanDescription(order)}
                      </span>
                    </div>
                  </div>

                  {/* BLOCO 3: TEMPO + PRONTO (SINO) + ENTREGAR (COMPACTADO EM ALTURA) */}
                  <div className="flex items-end justify-between md:justify-end gap-1.5 sm:gap-2 shrink-0">
                    {!isDelivered ? (
                      <div className="flex items-end gap-1.5 sm:gap-2">
                        {/* COLUNA: TEMPO */}
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 leading-none">
                            Tempo
                          </span>
                          <div className={`text-[11px] font-mono font-bold px-2 h-[28px] rounded-lg border flex items-center justify-center gap-1 ${getTimeColor(order.createdAt)}`}>
                            <Clock className="w-3 h-3" />
                            <span>{getElapsedTime(order.createdAt)}</span>
                          </div>
                        </div>

                        {/* COLUNA: PRONTO (SINO) */}
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 leading-none">
                            Pronto
                          </span>
                          <button
                            onClick={() => handleMarkReady(order.id)}
                            className="w-[28px] h-[28px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 rounded-lg transition-all border border-slate-700 hover:border-amber-400/80 shadow-md flex items-center justify-center cursor-pointer"
                            title="Tocar sino e chamar no painel PEDIDOS"
                          >
                            <BellRing className="w-3.5 h-3.5 animate-bounce" />
                          </button>
                        </div>

                        {/* BOTÃO PRINCIPAL: ENTREGAR */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleDeliver(order.id)}
                            className="px-3.5 h-[28px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-[11px] rounded-lg transition-all shadow-md flex items-center gap-1 border border-emerald-400 cursor-pointer"
                            title="Entregar pedido concluído"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ENTREGAR</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReopen(order.id)}
                        className="px-2.5 h-[28px] bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
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
