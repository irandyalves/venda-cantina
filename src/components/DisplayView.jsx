import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Flame,
  ArrowLeft
} from 'lucide-react';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import ProfileSelector from './ProfileSelector';

export default function DisplayView({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightOrder, setHighlightOrder] = useState(null);

  const prevReadyIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Escutar pedidos em tempo real
  useEffect(() => {
    const unsubscribe = storageService.subscribeOrders((allOrders) => {
      // Filtrar apenas pedidos de hoje
      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);

      // Detectar novo pedido que ficou PRONTO para soar o Ding-Dong e piscar na tela
      const readyOrders = todayOrders.filter(o => o.status === 'pronto');
      if (soundEnabled && !isFirstLoadRef.current) {
        readyOrders.forEach(order => {
          if (!prevReadyIdsRef.current.has(order.id)) {
            soundService.playReadySound();
            setHighlightOrder(order);
            setTimeout(() => setHighlightOrder(null), 8000);
          }
        });
      }

      // Atualiza ref
      const currentReadyIds = new Set(readyOrders.map(o => o.id));
      prevReadyIdsRef.current = currentReadyIds;
      isFirstLoadRef.current = false;

      setOrders(todayOrders);
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  // Fullscreen toggle
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
  const deliveredOrders = orders.filter(o => o.status === 'entregue').slice(0, 10); // 10 mais recentes

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden select-none">
      
      {/* TOPO DA TV COM CONTROLES DISCRETOS */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl shadow-lg">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-white">
              PAINEL DE PEDIDOS DA CANTINA
            </h1>
            <p className="text-xs text-slate-400 font-medium">Acompanhe sua comanda e nome na tela</p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-rose-400 border-rose-500/30'
            }`}
            title="Ligar/Desligar alarme sonoro na TV"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Fullscreen' : 'Tela Cheia'}</span>
          </button>

          <button
            onClick={() => onNavigate('cashier')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao Caixa</span>
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
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 px-6 py-4 flex items-center justify-center gap-4 animate-bounce shadow-2xl">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
          <div className="text-center">
            <span className="text-xs uppercase font-black tracking-widest bg-black/20 text-white px-3 py-0.5 rounded-full">
              🔔 PEDIDO PRONTO PARA RETIRADA!
            </span>
            <div className="text-3xl font-black mt-0.5 text-white drop-shadow">
              Comanda <span className="underline decoration-yellow-300">{highlightOrder.orderNumber}</span> — {highlightOrder.customerName}
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* ÁREA PRINCIPAL: DIVISÃO EM COLUNAS DESTACADAS */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* =========================================================
            COLUNA 1: EM PREPARAÇÃO (DESTAQUE PARA EM PREPARAÇÃO)
           ========================================================= */}
        <section className="md:col-span-5 flex flex-col bg-slate-900/80 rounded-3xl border-2 border-amber-500/40 p-5 shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between border-b-2 border-amber-500/30 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl">
                <Flame className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h2 className="text-xl font-black text-amber-300 uppercase tracking-wider">
                  EM PREPARAÇÃO
                </h2>
                <p className="text-xs text-slate-400">Na cozinha sendo preparado agora</p>
              </div>
            </div>
            <span className="text-xl font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-2xl">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                <Clock className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhum pedido em preparo no momento</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-md hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div>
                      <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                        {order.orderNumber}
                      </div>
                      <div className="text-lg font-bold text-white leading-tight">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {order.fullDescription || order.itemName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                      Cozinha
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* =========================================================
            COLUNA 2: PRONTOS (SE HOUVER) E ENTREGUES (DESTAQUE)
           ========================================================= */}
        <section className="md:col-span-7 flex flex-col gap-6 overflow-hidden">
          
          {/* PRONTOS PARA RETIRADA (CHAMADA IMEDIATA) */}
          {readyOrders.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 rounded-3xl border-2 border-emerald-400 p-5 shadow-2xl shadow-emerald-500/20 shrink-0">
              <div className="flex items-center justify-between border-b border-emerald-500/40 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                    <Sparkles className="w-6 h-6 animate-spin-slow" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-emerald-300 uppercase tracking-wider">
                      🔔 PRONTO PARA RETIRADA!
                    </h2>
                    <p className="text-xs text-emerald-200">Dirija-se ao balcão para retirar</p>
                  </div>
                </div>
                <span className="text-xl font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400 px-3 py-1 rounded-2xl">
                  {readyOrders.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-950/90 p-4 rounded-2xl border-2 border-emerald-400 shadow-xl flex items-center justify-between animate-pulse-subtle"
                  >
                    <div>
                      <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                        {order.orderNumber}
                      </div>
                      <div className="text-xl font-black text-white">
                        {order.customerName}
                      </div>
                    </div>
                    <span className="text-xs font-black bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-xl uppercase">
                      CHAMANDO
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              ENTREGUES (DESTAQUE PARA ENTREGUES CONFORME PEDIDO)
             ========================================================= */}
          <div className="flex-1 flex flex-col bg-slate-900/80 rounded-3xl border-2 border-blue-500/40 p-5 shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between border-b-2 border-blue-500/30 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-blue-300 uppercase tracking-wider">
                    PEDIDOS ENTREGUES
                  </h2>
                  <p className="text-xs text-slate-400">Clientes que já retiraram</p>
                </div>
              </div>
              <span className="text-xl font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-2xl">
                {deliveredOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {deliveredOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                  <CheckCircle2 className="w-12 h-12 mb-2 opacity-40" />
                  <p className="text-sm font-semibold">Nenhum pedido entregue ainda hoje</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliveredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-950/70 p-3.5 rounded-2xl border border-blue-500/30 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="text-xl font-black text-blue-400 font-mono">
                          {order.orderNumber}
                        </div>
                        <div className="text-base font-bold text-slate-200">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {order.fullDescription || order.itemName}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30 flex items-center gap-1">
                          ✓ Retirado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
