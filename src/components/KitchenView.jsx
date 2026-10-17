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
  ArrowRight
} from 'lucide-react';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';

export default function KitchenView({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' (em_preparo + pronto), 'entregue', 'all'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
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
    const unsubscribe = storageService.subscribeOrders((allOrders) => {
      // Identificar novos pedidos para tocar o som específico
      if (soundEnabled && !isFirstLoadRef.current) {
        allOrders.forEach((order) => {
          if (!knownOrderIdsRef.current.has(order.id) && order.status === 'em_preparo') {
            knownOrderIdsRef.current.add(order.id);
            // Toca som específico: Pizza, Batata ou Açaí
            soundService.playCategorySound(order.category || order.orderNumber);
          }
        });
      } else if (isFirstLoadRef.current) {
        // Na primeira carga, memoriza os existentes sem apitar
        allOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
        isFirstLoadRef.current = false;
      }

      setOrders(allOrders);
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  // Ações de status
  const handleDeliver = async (orderId) => {
    await storageService.updateOrderStatus(orderId, 'entregue');
  };

  const handleMarkReady = async (orderId) => {
    await storageService.updateOrderStatus(orderId, 'pronto');
    // Toca o aviso de pedido pronto
    soundService.playReadySound();
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

  // Cor do tempo decorrido
  const getTimeColor = (timestamp) => {
    const min = Math.floor((currentTime - timestamp) / 60000);
    if (min < 5) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    if (min < 10) return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    return 'text-rose-400 bg-rose-950/60 border-rose-500/50 animate-pulse';
  };

  // Ícone por categoria
  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('pizza')) return <Pizza className="w-5 h-5 text-red-400" />;
    if (cat.includes('acai') || cat.includes('açaí')) return <IceCream className="w-5 h-5 text-purple-400" />;
    return <UtensilsCrossed className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* CABEÇALHO DA COZINHA */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              COZINHA & PRODUÇÃO <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">KDS</span>
            </h1>
            <p className="text-xs text-slate-400">
              Fila em tempo real: <strong className="text-orange-400">{activeOrders.length} pedidos pendentes</strong>
            </p>
          </div>
        </div>

        {/* CONTROLES E SONS */}
        <div className="flex items-center gap-3">
          {/* TESTE DE SONS */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Testar Som:</span>
            <button 
              onClick={() => soundService.playPizzaSound()}
              className="px-2 py-0.5 bg-red-950/70 hover:bg-red-900 text-red-300 font-bold rounded border border-red-700/50"
            >
              🍕 Pizza
            </button>
            <button 
              onClick={() => soundService.playPotatoSound()}
              className="px-2 py-0.5 bg-amber-950/70 hover:bg-amber-900 text-amber-300 font-bold rounded border border-amber-700/50"
            >
              🍟 Batata
            </button>
            <button 
              onClick={() => soundService.playAcaiSound()}
              className="px-2 py-0.5 bg-purple-950/70 hover:bg-purple-900 text-purple-300 font-bold rounded border border-purple-700/50"
            >
              🍧 Açaí
            </button>
          </div>

          {/* TOGGLE SOM GERAL */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
              soundEnabled 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60' 
                : 'bg-rose-950/60 text-rose-300 border-rose-600/60'
            }`}
            title="Ligar ou desligar avisos sonoros da cozinha"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span>{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          {/* NAVEGAÇÃO */}
          <button 
            onClick={() => onNavigate('cashier')}
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
          >
            Ir ao Caixa
          </button>
          <button 
            onClick={() => onNavigate('display')}
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
          >
            Ir à TV
          </button>
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all ${
              activeFilter === 'active'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 Fila da Cozinha ({activeOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('entregue')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeFilter === 'entregue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ✓ Recém Entregues ({deliveredOrders.length})
          </button>
        </div>

        <div className="text-slate-400 text-xs">
          Dica: Ao entregar para o cliente, clique em <strong className="text-emerald-400">[ENTREGAR / DAR OK]</strong>
        </div>
      </div>

      {/* GRADE DE CARDS DOS PEDIDOS */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <Flame className="w-16 h-16 text-slate-700 mb-3 animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-400">Nenhum pedido pendente na cozinha!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Assim que o caixa confirmar uma venda, ela surgirá aqui com o alerta sonoro correspondente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedOrders.map((order) => {
              const isReady = order.status === 'pronto';
              const isDelivered = order.status === 'entregue';
              const isPreparing = order.status === 'em_preparo';

              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-2xl p-4 transition-all border-2 shadow-2xl relative ${
                    isDelivered
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : isReady
                        ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500 shadow-emerald-500/20'
                        : 'bg-slate-900 border-slate-700 hover:border-orange-500/70'
                  }`}
                >
                  {/* TOPO DO CARD: COMANDA, CRONÔMETRO E STATUS */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        {/* CÓDIGO DA COMANDA (P ped-01, P int-02, Bat 01, Açaí 01) */}
                        <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                          <span className="text-orange-400 font-mono">{order.orderNumber}</span>
                        </div>
                        {/* NOME DO CLIENTE EM DESTAQUE */}
                        <div className="text-base font-extrabold text-amber-300 mt-0.5">
                          👤 {order.customerName}
                        </div>
                      </div>

                      {/* TEMPO TRANSCORRIDO */}
                      {!isDelivered && (
                        <div className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${getTimeColor(order.createdAt)}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getElapsedTime(order.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* CONTEÚDO DO PEDIDO */}
                    <div className="my-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(order.category)}
                        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                          {order.categoryName}
                        </span>
                      </div>

                      {/* DESCRIÇÃO PRINCIPAL (SABOR / OPÇÃO) */}
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div className="text-lg font-black text-white leading-tight">
                          {order.fullDescription || order.itemName}
                        </div>

                        {/* QUANTIDADE EM DESTAQUE */}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="bg-orange-500/20 text-orange-300 font-black px-2 py-0.5 rounded-lg border border-orange-500/30">
                            QUANTIDADE: {order.quantity}x
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* STATUS ATUAL */}
                      <div className="flex items-center gap-2 text-xs font-bold pt-1">
                        <span className="text-slate-400">Status:</span>
                        {isPreparing && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            Em Preparação
                          </span>
                        )}
                        {isReady && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Pronto / Aguardando
                          </span>
                        )}
                        {isDelivered && (
                          <span className="text-blue-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Entregue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES DE 1 CLIQUE */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    
                    {/* FLUXO PRINCIPAL: DAR OK E ENTREGAR DIRETO */}
                    {!isDelivered ? (
                      <div className="flex flex-col gap-2">
                        
                        {/* BOTÃO PRINCIPAL: ENTREGAR / DAR OK */}
                        <button
                          onClick={() => handleDeliver(order.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 border border-emerald-400"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>ENTREGAR / DAR OK</span>
                        </button>

                        {/* BOTÃO SECUNDÁRIO: MÓDULO PRONTO (FUTURAMENTE / SE PREFERIR CHAMAR NA TV PRIMEIRO) */}
                        {isPreparing && (
                          <button
                            onClick={() => handleMarkReady(order.id)}
                            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                            title="Chamar na TV antes de entregar"
                          >
                            <BellRing className="w-3.5 h-3.5 text-amber-400" />
                            <span>Chamar na TV (Pronto)</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* CASO PRECISE REABRIR O PEDIDO ENTREGUE */
                      <button
                        onClick={() => handleReopen(order.id)}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir Pedido</span>
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
