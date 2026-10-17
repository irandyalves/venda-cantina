import React, { useState, useEffect, useRef } from 'react';
import { 
  Pizza, 
  IceCream, 
  UtensilsCrossed, 
  CheckCircle2, 
  Clock, 
  BellRing, 
  Settings, 
  DollarSign, 
  Send,
  AlertCircle,
  ChevronRight,
  User,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  ArrowRight,
  ShoppingCart,
  GripHorizontal,
  Disc
} from 'lucide-react';
import { storageService } from '../services/storage';
import ProfileSelector from './ProfileSelector';
import AutoToast from './AutoToast';

export default function CashierView({ onOpenConfig, onNavigate }) {
  // Estado do Caixa
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);
  const [currentEvent, setCurrentEvent] = useState(() => storageService.getCurrentEvent());

  // SELEÇÃO ATIVA DO PRODUTO (1º PASSO)
  const [selectedPizzaFlavor, setSelectedPizzaFlavor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // { category, item, variation }

  // CAMPOS DE FINALIZAÇÃO (2º PASSO)
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Validação e feedback
  const [nameShake, setNameShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [toast, setToast] = useState(null);

  const nameInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const submitButtonRef = useRef(null);
  const drawerRef = useRef(null);

  // Altura customizável do rodapé arrastando a borda superior (clique e arraste para cima/baixo)
  const [footerHeight, setFooterHeight] = useState(() => {
    try {
      const saved = localStorage.getItem('cantina_cashier_footer_h');
      return saved ? Math.max(150, Math.min(650, parseInt(saved, 10))) : 240;
    } catch {
      return 240;
    }
  });
  const isDraggingFooterRef = useRef(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(240);

  const handleStartResize = (e) => {
    e.preventDefault();
    isDraggingFooterRef.current = true;
    startDragYRef.current = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    startHeightRef.current = footerHeight;

    const onMove = (moveEvent) => {
      if (!isDraggingFooterRef.current) return;
      const clientY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0]?.clientY) || 0;
      const deltaY = startDragYRef.current - clientY; // Puxar para CIMA aumenta a altura
      const maxHeight = Math.max(300, Math.round(window.innerHeight * 0.75));
      const newHeight = Math.max(140, Math.min(maxHeight, startHeightRef.current + deltaY));
      setFooterHeight(newHeight);
    };

    const onEnd = () => {
      if (isDraggingFooterRef.current) {
        isDraggingFooterRef.current = false;
        setFooterHeight((current) => {
          try {
            localStorage.setItem('cantina_cashier_footer_h', String(Math.round(current)));
          } catch (_) {}
          return current;
        });
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  // Carregar produtos e escutar pedidos em tempo real
  useEffect(() => {
    setCategories(storageService.getProducts());

    const unsubscribeOrders = storageService.subscribeOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubscribeStatus = storageService.onConnectionStatusChange((status) => {
      setIsFirebaseOnline(status);
    });

    const handleEvt = (e) => setCurrentEvent(e.detail || storageService.getCurrentEvent());
    window.addEventListener('cantina_event_changed', handleEvt);

    return () => {
      unsubscribeOrders();
      unsubscribeStatus();
      window.removeEventListener('cantina_event_changed', handleEvt);
    };
  }, []);

  // Quando um produto é selecionado, dá foco automático no campo de nome e rola suavemente para o formulário
  useEffect(() => {
    if (selectedProduct) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 70);
    }
  }, [selectedProduct]);

  // Totais e listas do rodapé (mais novos em cima)
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const sortNewestFirst = (list) => {
    return [...list].sort((a, b) => {
      const timeA = new Date(b.createdAt || 0).getTime();
      const timeB = new Date(a.createdAt || 0).getTime();
      return timeA - timeB;
    });
  };

  const preparingList = sortNewestFirst(todayOrders.filter(o => o.status === 'em_preparo'));
  const readyList = sortNewestFirst(todayOrders.filter(o => o.status === 'pronto'));
  const deliveredList = sortNewestFirst(todayOrders.filter(o => o.status === 'entregue'));

  const countEmPreparo = preparingList.length;
  const countProntas = readyList.length;
  const countEntregues = deliveredList.length;
  const totalFaturado = todayOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  // Cores distintas para Pizza, Açaí e Batata nos Cards do Rodapé
  const getOrderCategoryStyle = (order) => {
    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (cat.includes('pizza') || cat.includes('ped') || cat.includes('int')) {
      return {
        icon: <Pizza className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
        border: 'border-orange-500/50 hover:border-orange-400',
        bg: 'bg-orange-950/40 hover:bg-orange-950/60',
        badgeColor: 'text-orange-300 bg-orange-950/90 border-orange-500/50',
        textColor: 'text-orange-200'
      };
    }
    if (cat.includes('acai') || cat.includes('açaí')) {
      return {
        icon: <IceCream className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
        border: 'border-purple-500/50 hover:border-purple-400',
        bg: 'bg-purple-950/40 hover:bg-purple-950/60',
        badgeColor: 'text-purple-300 bg-purple-950/90 border-purple-500/50',
        textColor: 'text-purple-200'
      };
    }
    if (cat.includes('batata') || cat.includes('frita')) {
      return {
        icon: <UtensilsCrossed className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
        border: 'border-yellow-500/50 hover:border-yellow-400',
        bg: 'bg-yellow-950/40 hover:bg-yellow-950/60',
        badgeColor: 'text-yellow-300 bg-yellow-950/90 border-yellow-500/50',
        textColor: 'text-yellow-200'
      };
    }
    return {
      icon: <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      border: 'border-slate-700 hover:border-slate-500',
      bg: 'bg-slate-900/60 hover:bg-slate-850',
      badgeColor: 'text-slate-300 bg-slate-800 border-slate-600',
      textColor: 'text-slate-200'
    };
  };

  const getItemSummary = (order) => {
    if (order.variationName) {
      return `${order.itemName} (${order.variationName})`;
    }
    return order.itemName || order.fullDescription || 'Item';
  };

  // 1º PASSO: Selecionar o produto
  const handleSelectPizzaFlavor = (flavor) => {
    setSelectedPizzaFlavor(flavor);
    const pizzaCat = categories.find(c => c.id === 'pizza');
    const currentVarId = (selectedProduct?.category?.id === 'pizza' && selectedProduct?.variation?.id) 
      ? selectedProduct.variation.id 
      : 'pedaco';
    const chosenVar = pizzaCat?.variations?.find(v => v.id === currentVarId) 
      || pizzaCat?.variations?.find(v => v.id === 'pedaco') 
      || pizzaCat?.variations?.[0];

    setSelectedProduct({
      category: pizzaCat,
      item: flavor,
      variation: chosenVar
    });
  };

  const handleSelectPizzaVariation = (variation) => {
    if (!selectedPizzaFlavor) return;
    const pizzaCat = categories.find(c => c.id === 'pizza');
    setSelectedProduct({
      category: pizzaCat,
      item: selectedPizzaFlavor,
      variation: variation
    });
    setTimeout(() => nameInputRef.current?.focus(), 60);
  };

  const handleSelectDirectItem = (category, item) => {
    setSelectedPizzaFlavor(null);
    setSelectedProduct({
      category,
      item,
      variation: null
    });
    setTimeout(() => nameInputRef.current?.focus(), 60);
  };

  // 2º PASSO: Enviar direto para a cozinha com o botão verde
  const handleConfirmAndSend = async (e) => {
    if (e) e.preventDefault();

    if (!selectedProduct) return;

    // Validação obrigatória do nome
    const cleanName = customerName.trim();
    if (!cleanName) {
      setNameShake(true);
      setShowNameError(true);
      if (nameInputRef.current) nameInputRef.current.focus();
      setTimeout(() => setNameShake(false), 500);
      return;
    }

    setShowNameError(false);
    const qty = Math.max(1, parseInt(quantity) || 1);
    const { category, item, variation } = selectedProduct;

    // Determina o prefixo e descrição
    let prefix = 'Pp-';
    let unitPrice = item.price || 0;
    let description = item.name;

    if (category.id === 'pizza' && variation) {
      prefix = variation.prefix || (variation.id === 'inteira' ? 'Pi-' : 'Pp-');
      unitPrice = variation.price;
      description = `${variation.name.toUpperCase()}: ${item.name}`;
    } else if (category.id === 'acai') {
      prefix = item.prefix || category.prefixDefault || 'A-';
      description = item.name;
    } else if (category.id === 'batata') {
      prefix = item.prefix || category.prefixDefault || 'B-';
      description = item.name;
    } else {
      prefix = item.prefix || category.prefixDefault || 'Ped-';
    }

    const orderNumber = storageService.getNextOrderNumber(prefix);
    const totalPrice = unitPrice * qty;

    const newOrder = {
      orderNumber,
      customerName: cleanName,
      category: category.id,
      categoryName: category.name,
      itemName: item.name,
      variationName: variation ? variation.name : null,
      fullDescription: description,
      quantity: qty,
      unitPrice,
      totalPrice,
      paymentMethod,
    };

    try {
      const created = await storageService.createOrder(newOrder);

      // Feedback visual em Modal Bonito de 2 Segundos
      setToast({
        type: 'success',
        title: 'Pedido Enviado para a Cozinha!',
        message: `Comanda ${created.orderNumber} gerada com sucesso!`,
        subtext: `Cliente: ${cleanName.toUpperCase()} • ${description} (${qty}x)`
      });

      // Resetar para a próxima escolha
      setSelectedProduct(null);
      setSelectedPizzaFlavor(null);
      setCustomerName('');
      setQuantity(1);
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        title: 'Falha no Envio',
        message: 'Erro ao enviar pedido para a cozinha.',
        subtext: err.message
      });
    }
  };

  const cancelSelection = () => {
    setSelectedProduct(null);
    setCustomerName('');
    setQuantity(1);
  };

  const pizzaCategory = categories.find(c => c.id === 'pizza');
  const acaiCategory = categories.find(c => c.id === 'acai');
  const batataCategory = categories.find(c => c.id === 'batata');

  const isNameFilled = customerName.trim().length > 0;



  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden text-xs">
      
      {/* BARRA SUPERIOR DO CAIXA */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-amber-500 to-red-600 p-1.5 rounded-lg shadow">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-widest text-white uppercase leading-none">
              CAIXA
            </h1>
            {currentEvent?.name && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-600/40 px-2 py-0.5 rounded-md">
                🎉 {currentEvent.name}
              </span>
            )}
          </div>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex items-center gap-2">
          {/* APENAS A BOLINHA PISCANTE, SEM BORDA NEM TEXTO */}
          <div className="flex items-center justify-center px-1" title={isFirebaseOnline ? 'Conexão Nuvem Online' : 'Modo Local'}>
            <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          </div>

          {/* BOTÃO DA ENGRENAGEM (CONFIGURAÇÕES DO CAIXA) */}
          <button 
            onClick={() => onOpenConfig()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-sm active:scale-95 border border-amber-500 cursor-pointer"
            title="Configurações, Cadastro de Produtos, Preços e Fechamento de Caixa"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden sm:inline">CONFIGURAÇÕES ⚙️</span>
          </button>

          <ProfileSelector 
            onProfileChange={(profile) => {
              if (profile === 'COZINHA') onNavigate('kitchen');
              else if (profile === 'PUBLICO') onNavigate('display');
            }}
            onOpenConfig={onOpenConfig}
          />
        </div>
      </header>

      {/* MODAL BONITO DE 2 SEGUNDOS */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={2000} />

      {/* ========================================================
          ÁREA DO TOPO DO CAIXA:
          - SE NADA SELECIONADO: AVISO AMIGÁVEL
          - QUANDO ESCOLHE (PEDAÇO/INTEIRO/ITEM): ABRE NOME, QTDE E BOTÃO VERDE ENVIAR!
         ======================================================== */}
      {/* ========================================================
          ÁREA DO TOPO DO CAIXA:
          - DICA INICIAL AMIGÁVEL (QUANDO NENHUM ITEM ESCOLHIDO)
          - AO ESCOLHER O PRODUTO, O FORMULÁRIO DESCE EM EFEITO CORTINA
            DIRETAMENTE EMBAIXO DO ITEM SELECIONADO!
         ======================================================== */}
      {!selectedProduct && (
        <div className="px-3 pt-2.5 shrink-0">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-dashed border-slate-700 text-slate-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <div>
                <span className="font-extrabold text-xs text-white">1º PASSO:</span>{' '}
                <span className="text-xs text-slate-300">
                  Clique no produto abaixo (ex: sabor de <strong>Pizza ➔ Pedaço ou Inteiro</strong>, ou <strong>Açaí</strong>, ou <strong>Batata</strong>)
                </span>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              Aguardando Escolha
            </span>
          </div>
        </div>
      )}

      {/* CORPO PRINCIPAL COM OS PRODUTOS (SELEÇÃO DIRETA) */}
      <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5">

        {/* ========================================================
            SEÇÃO 1: PIZZA (CLICOU NO SABOR -> ABRE PEDAÇO OU INTEIRO)
           ======================================================== */}
        {pizzaCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30">
                  <Pizza className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  PIZZA <span className="text-[10px] font-normal text-slate-400 normal-case">— Escolha o sabor</span>
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-orange-300 bg-orange-950/80 px-1.5 py-0.2 rounded-full border border-orange-500/30 font-mono">
                Pp-XX / Pi-XX
              </span>
            </div>

            {/* BOTÕES DOS SABORES DE PIZZA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {pizzaCategory.items.map((flavor) => {
                const isSelected = selectedPizzaFlavor?.id === flavor.id;
                return (
                  <button
                    key={flavor.id}
                    onClick={() => handleSelectPizzaFlavor(flavor)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow ring-2 ring-amber-400 scale-[1.01]'
                        : 'bg-slate-900/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs leading-tight">{flavor.name}</div>
                      <div className={`text-[9px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        {flavor.description || 'Sabor tradicional'}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        {isSelected ? '✓ Selecionado' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AO CLICAR NO SABOR: ABRE DUAS SEÇÕES (ESQ: PEDAÇO/INTEIRA EMPILHADOS, DIR: 3 LINHAS) */}
            {selectedPizzaFlavor ? (
              <div 
                ref={drawerRef}
                className="mt-2.5 p-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-emerald-500/80 shadow-2xl animate-curtain-down space-y-2.5"
              >
                {/* CABEÇALHO DO SABOR */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                    </span>
                    <span className="text-xs uppercase font-extrabold text-slate-300">
                      Sabor Selecionado:{' '}
                      <strong className="text-amber-300 font-black text-sm">
                        {selectedPizzaFlavor.name}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={cancelSelection}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Fechar e cancelar escolha"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Fechar</span>
                  </button>
                </div>

                {/* DUAS SEÇÕES: ESQ (PEDAÇO / INTEIRA) E DIR (3 LINHAS) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                  
                  {/* SEÇÃO DA ESQUERDA: DOIS BOTÕES UM EM CIMA E OUTRO EM BAIXO DO TAMANHO DE MARGUERITA */}
                  <div className="md:col-span-4 xl:col-span-3 flex flex-col justify-between gap-2">
                    {pizzaCategory.variations.map((variation) => {
                      const isPedaco = variation.id === 'pedaco';
                      const isCurrentChoice = selectedProduct?.variation?.id === variation.id;

                      return (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() => handleSelectPizzaVariation(variation)}
                          className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border min-h-[62px] cursor-pointer ${
                            isCurrentChoice
                              ? isPedaco
                                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow ring-2 ring-amber-400 font-black scale-[1.01]'
                                : 'bg-red-600 text-white border-red-300 shadow ring-2 ring-red-400 font-black scale-[1.01]'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 font-extrabold text-xs">
                              {isPedaco ? (
                                <Pizza className={`w-3.5 h-3.5 ${isCurrentChoice ? 'text-slate-950' : 'text-amber-400'}`} />
                              ) : (
                                <Disc className={`w-3.5 h-3.5 ${isCurrentChoice ? 'text-white' : 'text-red-400'}`} />
                              )}
                              <span>{variation.name}</span>
                            </div>
                            <span className="font-mono font-black text-xs">
                              R$ {variation.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between w-full">
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono ${
                              isCurrentChoice 
                                ? (isPedaco ? 'bg-slate-950/20 text-slate-950' : 'bg-black/30 text-white')
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {variation.prefix || (isPedaco ? 'Pp-' : 'Pi-')}XX
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isCurrentChoice
                                ? (isPedaco ? 'bg-slate-950 text-amber-300' : 'bg-black/40 text-rose-200')
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isCurrentChoice ? '✓ Selecionado' : 'Escolher'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* SEÇÃO DA DIREITA: CAMPOS EM 3 LINHAS */}
                  <form onSubmit={handleConfirmAndSend} className="md:col-span-8 xl:col-span-9 flex flex-col justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    
                    {/* LINHA 1: NOME DE QUEM COMPROU (OCUPA UMA LINHA INTEIRA) */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isNameFilled ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <User className="w-3.5 h-3.5" />
                          <span>Nome de quem comprou *</span>
                        </label>
                        {!isNameFilled ? (
                          <span className="text-[9px] text-rose-300 font-extrabold bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/60 animate-pulse">
                            ⚠️ Obrigatório
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                            ✓ Preenchido
                          </span>
                        )}
                      </div>

                      <div className={`relative ${nameShake ? 'animate-shake' : ''}`}>
                        <input
                          ref={nameInputRef}
                          type="text"
                          required
                          placeholder="Digite o nome de quem comprou..."
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            if (showNameError && e.target.value.trim()) setShowNameError(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!customerName.trim()) {
                                setNameShake(true);
                                setShowNameError(true);
                                setTimeout(() => setNameShake(false), 500);
                              } else {
                                qtyInputRef.current?.focus();
                                qtyInputRef.current?.select();
                              }
                            }
                          }}
                          className={`w-full h-9 sm:h-10 bg-slate-950 text-white text-sm font-bold px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs border-2 ${
                            !isNameFilled 
                              ? 'border-rose-500 glow-required-name' 
                              : 'border-emerald-500 ring-2 ring-emerald-500/30'
                          }`}
                        />
                      </div>
                    </div>

                    {/* LINHA 2: QUANTIDADE E TIPO PAGAMENTO (LADO A LADO) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* QUANTIDADE */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                          Quantidade
                        </label>
                        <div className="h-9 sm:h-10 flex items-center gap-1 bg-slate-950 px-1.5 rounded-xl border border-slate-700">
                          <button 
                            type="button"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input 
                            ref={qtyInputRef}
                            type="number"
                            min="1"
                            max="99"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                paymentSelectRef.current?.focus();
                              }
                            }}
                            className="w-full text-center bg-transparent text-sm font-black text-amber-300 outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => setQuantity(q => q + 1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* FORMA DE PAGAMENTO */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                          Pagamento
                        </label>
                        <select
                          ref={paymentSelectRef}
                          value={paymentMethod}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setTimeout(() => submitButtonRef.current?.focus(), 50);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              submitButtonRef.current?.focus();
                            }
                          }}
                          className="w-full h-9 sm:h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2.5 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all cursor-pointer"
                        >
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="DEBITO">Débito</option>
                          <option value="CREDITO">Crédito</option>
                        </select>
                      </div>
                    </div>

                    {/* LINHA 3: BOTÃO ENVIAR PARA A COZINHA (OCUPA A LINHA INTEIRA) */}
                    <div>
                      <button
                        ref={submitButtonRef}
                        type="submit"
                        className="w-full h-10 sm:h-11 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                      >
                        <Send className="w-4 h-4 fill-current" />
                        <span>ENVIAR PARA COZINHA</span>
                        <span className="ml-1 bg-slate-950/20 px-2 py-0.5 rounded font-mono text-xs font-black">
                          Total: R$ {((selectedProduct?.variation?.price || 0) * quantity).toFixed(2)}
                        </span>
                      </button>
                    </div>

                  </form>
                </div>

                {showNameError && (
                  <div className="text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Por favor, digite o nome de quem comprou para enviar para a cozinha!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-center py-1.5 bg-slate-900/50 rounded-lg border border-dashed border-slate-700 text-[10px] text-slate-400">
                👆 Clique no sabor da pizza para abrir as opções e enviar para a cozinha.
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ E BATATA FRITA (2 COLUNAS: ESQ OPÇÕES / DIR FORMULÁRIO)
           ======================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
          
          {/* SEÇÃO AÇAÍ */}
          {acaiCategory && (
            <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30">
                      <IceCream className="w-3.5 h-3.5" />
                    </span>
                    <h2 className="text-xs font-black text-white tracking-wide uppercase">
                      AÇAÍ <span className="text-[10px] font-normal text-slate-400 normal-case">— Tamanhos de copo</span>
                    </h2>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded-full border border-purple-500/30 font-mono">
                    A-XX
                  </span>
                </div>

                {/* 2 COLUNAS: ESQ (TAMANHOS DE COPO) E DIR (MESMAS OPÇÕES DE PIZZA) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
                  
                  {/* COLUNA ESQUERDA: TAMANHOS DE COPO VERTICAIS (DO TAMANHO DE MARGUERITA) */}
                  <div className="sm:col-span-5 flex flex-col gap-1.5 justify-between">
                    {acaiCategory.items.map((item) => {
                      const isCurrent = selectedProduct?.category?.id === 'acai' && selectedProduct?.item?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectDirectItem(acaiCategory, item)}
                          className={`p-2 rounded-lg text-left transition-all flex items-center justify-between border min-h-[46px] cursor-pointer ${
                            isCurrent
                              ? 'bg-purple-800 text-white border-purple-400 shadow ring-2 ring-purple-400 font-black scale-[1.01]'
                              : 'bg-slate-900/90 hover:bg-purple-950/70 text-slate-200 border-slate-700 hover:border-purple-500/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IceCream className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-purple-200' : 'text-purple-400'}`} />
                            <div className="truncate">
                              <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                              <div className="text-[10px] text-purple-300 font-mono font-bold">R$ {item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                            isCurrent ? 'bg-purple-950 text-purple-200 border border-purple-400/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isCurrent ? '✓ Selecionado' : 'Escolher'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* COLUNA DIREITA: MESMAS OPÇÕES DE PIZZA (3 LINHAS) OU PLACEHOLDER */}
                  <div className="sm:col-span-7 flex flex-col justify-between">
                    {selectedProduct?.category?.id === 'acai' ? (
                      <form onSubmit={handleConfirmAndSend} className="h-full flex flex-col justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        
                        {/* LINHA 1: NOME DE QUEM COMPROU (OCUPA UMA LINHA INTEIRA) */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                              isNameFilled ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              <User className="w-3.5 h-3.5" />
                              <span>Nome de quem comprou *</span>
                            </label>
                            {!isNameFilled ? (
                              <span className="text-[9px] text-rose-300 font-extrabold bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/60 animate-pulse">
                                ⚠️ Obrigatório
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                ✓ Preenchido
                              </span>
                            )}
                          </div>

                          <div className={`relative ${nameShake ? 'animate-shake' : ''}`}>
                            <input
                              ref={nameInputRef}
                              type="text"
                              required
                              placeholder="Digite o nome de quem comprou..."
                              value={customerName}
                              onChange={(e) => {
                                setCustomerName(e.target.value);
                                if (showNameError && e.target.value.trim()) setShowNameError(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!customerName.trim()) {
                                    setNameShake(true);
                                    setShowNameError(true);
                                    setTimeout(() => setNameShake(false), 500);
                                  } else {
                                    qtyInputRef.current?.focus();
                                    qtyInputRef.current?.select();
                                  }
                                }
                              }}
                              className={`w-full h-9 sm:h-10 bg-slate-950 text-white text-sm font-bold px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs border-2 ${
                                !isNameFilled 
                                  ? 'border-rose-500 glow-required-name' 
                                  : 'border-emerald-500 ring-2 ring-emerald-500/30'
                              }`}
                            />
                          </div>
                        </div>

                        {/* LINHA 2: QUANTIDADE E TIPO PAGAMENTO (LADO A LADO) */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* QUANTIDADE */}
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                              Quantidade
                            </label>
                            <div className="h-9 sm:h-10 flex items-center gap-1 bg-slate-950 px-1.5 rounded-xl border border-slate-700">
                              <button 
                                type="button"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <input 
                                ref={qtyInputRef}
                                type="number"
                                min="1"
                                max="99"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    paymentSelectRef.current?.focus();
                                  }
                                }}
                                className="w-full text-center bg-transparent text-sm font-black text-purple-300 outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* FORMA DE PAGAMENTO */}
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                              Pagamento
                            </label>
                            <select
                              ref={paymentSelectRef}
                              value={paymentMethod}
                              onChange={(e) => {
                                setPaymentMethod(e.target.value);
                                setTimeout(() => submitButtonRef.current?.focus(), 50);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  submitButtonRef.current?.focus();
                                }
                              }}
                              className="w-full h-9 sm:h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2.5 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all cursor-pointer"
                            >
                              <option value="PIX">PIX</option>
                              <option value="DINHEIRO">Dinheiro</option>
                              <option value="DEBITO">Débito</option>
                              <option value="CREDITO">Crédito</option>
                            </select>
                          </div>
                        </div>

                        {/* LINHA 3: BOTÃO ENVIAR PARA A COZINHA */}
                        <div>
                          <button
                            ref={submitButtonRef}
                            type="submit"
                            className="w-full h-10 sm:h-11 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                          >
                            <Send className="w-4 h-4 fill-current" />
                            <span>ENVIAR PARA COZINHA</span>
                            <span className="ml-1 bg-slate-950/20 px-2 py-0.5 rounded font-mono text-xs font-black">
                              Total: R$ {((selectedProduct?.item?.price || 0) * quantity).toFixed(2)}
                            </span>
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="h-full min-h-[170px] flex flex-col items-center justify-center p-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-700/80 text-slate-400">
                        <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-2">
                          <IceCream className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">Escolha o tamanho do copo</span>
                        <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                          Clique ao lado para preencher o nome e enviar para a cozinha
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {showNameError && selectedProduct?.category?.id === 'acai' && (
                <div className="mt-2 text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Por favor, digite o nome de quem comprou para enviar para a cozinha!</span>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO BATATA FRITA */}
          {batataCategory && (
            <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-yellow-500/20 text-yellow-400 rounded-md border border-yellow-500/30">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                    </span>
                    <h2 className="text-xs font-black text-white tracking-wide uppercase">
                      BATATA <span className="text-[10px] font-normal text-slate-400 normal-case">— Opções de porção</span>
                    </h2>
                  </div>
                  <span className="text-[10px] font-semibold text-yellow-300 bg-yellow-950/80 px-1.5 py-0.2 rounded-full border border-yellow-500/30 font-mono">
                    B-XX
                  </span>
                </div>

                {/* 2 COLUNAS: ESQ (ITENS DE BATATA) E DIR (MESMAS OPÇÕES DE PIZZA) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
                  
                  {/* COLUNA ESQUERDA: ITENS DE BATATA VERTICAIS (DO TAMANHO DE MARGUERITA) */}
                  <div className="sm:col-span-5 flex flex-col gap-1.5 justify-between">
                    {batataCategory.items.map((item) => {
                      const isCurrent = selectedProduct?.category?.id === 'batata' && selectedProduct?.item?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectDirectItem(batataCategory, item)}
                          className={`p-2 rounded-lg text-left transition-all flex items-center justify-between border min-h-[46px] cursor-pointer ${
                            isCurrent
                              ? 'bg-yellow-500 text-slate-950 border-yellow-300 shadow ring-2 ring-yellow-400 font-black scale-[1.01]'
                              : 'bg-slate-900/90 hover:bg-yellow-950/70 text-slate-200 border-slate-700 hover:border-yellow-500/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <UtensilsCrossed className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-slate-950' : 'text-yellow-400'}`} />
                            <div className="truncate">
                              <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                              <div className="text-[10px] text-yellow-300 font-mono font-bold">R$ {item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                            isCurrent ? 'bg-slate-950 text-yellow-300 border border-yellow-400/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isCurrent ? '✓ Selecionado' : 'Escolher'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* COLUNA DIREITA: MESMAS OPÇÕES DE PIZZA (3 LINHAS) OU PLACEHOLDER */}
                  <div className="sm:col-span-7 flex flex-col justify-between">
                    {selectedProduct?.category?.id === 'batata' ? (
                      <form onSubmit={handleConfirmAndSend} className="h-full flex flex-col justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        
                        {/* LINHA 1: NOME DE QUEM COMPROU (OCUPA UMA LINHA INTEIRA) */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                              isNameFilled ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              <User className="w-3.5 h-3.5" />
                              <span>Nome de quem comprou *</span>
                            </label>
                            {!isNameFilled ? (
                              <span className="text-[9px] text-rose-300 font-extrabold bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/60 animate-pulse">
                                ⚠️ Obrigatório
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                ✓ Preenchido
                              </span>
                            )}
                          </div>

                          <div className={`relative ${nameShake ? 'animate-shake' : ''}`}>
                            <input
                              ref={nameInputRef}
                              type="text"
                              required
                              placeholder="Digite o nome de quem comprou..."
                              value={customerName}
                              onChange={(e) => {
                                setCustomerName(e.target.value);
                                if (showNameError && e.target.value.trim()) setShowNameError(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!customerName.trim()) {
                                    setNameShake(true);
                                    setShowNameError(true);
                                    setTimeout(() => setNameShake(false), 500);
                                  } else {
                                    qtyInputRef.current?.focus();
                                    qtyInputRef.current?.select();
                                  }
                                }
                              }}
                              className={`w-full h-9 sm:h-10 bg-slate-950 text-white text-sm font-bold px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs border-2 ${
                                !isNameFilled 
                                  ? 'border-rose-500 glow-required-name' 
                                  : 'border-emerald-500 ring-2 ring-emerald-500/30'
                              }`}
                            />
                          </div>
                        </div>

                        {/* LINHA 2: QUANTIDADE E TIPO PAGAMENTO (LADO A LADO) */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* QUANTIDADE */}
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                              Quantidade
                            </label>
                            <div className="h-9 sm:h-10 flex items-center gap-1 bg-slate-950 px-1.5 rounded-xl border border-slate-700">
                              <button 
                                type="button"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <input 
                                ref={qtyInputRef}
                                type="number"
                                min="1"
                                max="99"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    paymentSelectRef.current?.focus();
                                  }
                                }}
                                className="w-full text-center bg-transparent text-sm font-black text-yellow-300 outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* FORMA DE PAGAMENTO */}
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block mb-0.5">
                              Pagamento
                            </label>
                            <select
                              ref={paymentSelectRef}
                              value={paymentMethod}
                              onChange={(e) => {
                                setPaymentMethod(e.target.value);
                                setTimeout(() => submitButtonRef.current?.focus(), 50);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  submitButtonRef.current?.focus();
                                }
                              }}
                              className="w-full h-9 sm:h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2.5 rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 transition-all cursor-pointer"
                            >
                              <option value="PIX">PIX</option>
                              <option value="DINHEIRO">Dinheiro</option>
                              <option value="DEBITO">Débito</option>
                              <option value="CREDITO">Crédito</option>
                            </select>
                          </div>
                        </div>

                        {/* LINHA 3: BOTÃO ENVIAR PARA A COZINHA */}
                        <div>
                          <button
                            ref={submitButtonRef}
                            type="submit"
                            className="w-full h-10 sm:h-11 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                          >
                            <Send className="w-4 h-4 fill-current" />
                            <span>ENVIAR PARA COZINHA</span>
                            <span className="ml-1 bg-slate-950/20 px-2 py-0.5 rounded font-mono text-xs font-black">
                              Total: R$ {((selectedProduct?.item?.price || 0) * quantity).toFixed(2)}
                            </span>
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="h-full min-h-[170px] flex flex-col items-center justify-center p-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-700/80 text-slate-400">
                        <div className="p-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-2">
                          <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">Escolha a opção de batata</span>
                        <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                          Clique ao lado para preencher o nome e enviar para a cozinha
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {showNameError && selectedProduct?.category?.id === 'batata' && (
                <div className="mt-2 text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Por favor, digite o nome de quem comprou para enviar para a cozinha!</span>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* ========================================================
          RODAPÉ DO CAIXA: 3 COLUNAS COM ATÉ 10 ITENS (ROLÁVEL)
          - EM PREPARAÇÃO, PRONTAS, RETIRADAS
          - MAIS NOVOS EM CIMA
          - CARDS: ÍCONE NR PEDIDO | NOME | ITEM
          - CORES DIFERENTES: PIZZA (AMBER), AÇAÍ (ROXO), BATATA (AMARELO)
         ======================================================== */}
      {/* ========================================================
          RODAPÉ DO CAIXA: 3 COLUNAS REDIMENSIONÁVEIS (ARRASTAR LINHA SUPERIOR)
          - EM PREPARAÇÃO, PRONTAS, RETIRADAS
          - CLIQUE, SEGURE E ARRASTE A LINHA SUPERIOR PARA CIMA/BAIXO
          - CARDS: ÍCONE NR PEDIDO | NOME | ITEM
          - CORES DIFERENTES: PIZZA (AMBER), AÇAÍ (ROXO), BATATA (AMARELO)
         ======================================================== */}
      <footer 
        style={{ height: `${footerHeight}px` }}
        className="bg-slate-950 border-t-2 border-slate-700/80 px-2.5 sm:px-3 pb-2 shrink-0 shadow-2xl flex flex-col relative select-none"
      >
        {/* LINHA SUPERIOR REDIMENSIONÁVEL / BARRA DE PUXAR COM MOUSE E TOUCH */}
        <div 
          onMouseDown={handleStartResize}
          onTouchStart={handleStartResize}
          className="absolute -top-3 left-0 right-0 h-6 flex items-center justify-center cursor-ns-resize group z-30 touch-none"
          title="Clique, segure e arraste para cima ou para baixo para ajustar a altura da seção"
        >
          {/* BARRA VISUAL DE AGARRE */}
          <div className="h-1.5 w-24 sm:w-32 bg-slate-600 group-hover:bg-amber-400 group-active:bg-amber-400 rounded-full transition-all shadow-md flex items-center justify-center">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-950" />
          </div>
        </div>
        
        {/* LINHA DE RESUMO SUPERIOR DO RODAPÉ */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pt-1.5 pb-1 text-[11px] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>FLUXO DE PEDIDOS:</span>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(Arraste a linha superior para redimensionar • Rolagem até 10+ pedidos)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 font-semibold text-[10px]">Total Hoje:</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                R$ {totalFaturado.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 COLUNAS: EM PREPARAÇÃO, PRONTAS, RETIRADAS (FLEX-1 PARA PREENCHER A ALTURA ARRASTADA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5 flex-1 min-h-0 pt-1">
          
          {/* COLUNA 1: EM PREPARAÇÃO */}
          <div className="bg-slate-900/80 rounded-xl border border-amber-500/40 p-2 flex flex-col shadow-inner min-h-0">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/25 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  EM PREPARAÇÃO
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-500/30">
                {preparingList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {preparingList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium">
                  Nenhum pedido em preparo
                </div>
              ) : (
                preparingList.map((order) => {
                  const style = getOrderCategoryStyle(order);
                  const itemText = getItemSummary(order);
                  return (
                    <div 
                      key={order.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${style.border} ${style.bg} transition-all shadow-sm text-xs`}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        {style.icon}
                        <span className={`font-mono font-black text-[11px] px-1.5 py-0.2 rounded border ${style.badgeColor}`}>
                          {order.orderNumber}
                        </span>
                      </div>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className="text-[11px] font-black text-white uppercase truncate max-w-[85px] sm:max-w-[110px]" title={order.customerName}>
                        {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className={`text-[10px] font-bold ${style.textColor} truncate flex-1`} title={itemText}>
                        {itemText} {order.quantity > 1 ? `(${order.quantity}x)` : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUNA 2: PRONTAS */}
          <div className="bg-slate-900/80 rounded-xl border border-emerald-500/40 p-2 flex flex-col shadow-inner min-h-0">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-500/25 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  PRONTAS
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-500/30">
                {readyList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {readyList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium">
                  Nenhum pedido pronto
                </div>
              ) : (
                readyList.map((order) => {
                  const style = getOrderCategoryStyle(order);
                  const itemText = getItemSummary(order);
                  return (
                    <div 
                      key={order.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${style.border} ${style.bg} transition-all shadow-sm text-xs`}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        {style.icon}
                        <span className={`font-mono font-black text-[11px] px-1.5 py-0.2 rounded border ${style.badgeColor}`}>
                          {order.orderNumber}
                        </span>
                      </div>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className="text-[11px] font-black text-white uppercase truncate max-w-[85px] sm:max-w-[110px]" title={order.customerName}>
                        {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className={`text-[10px] font-bold ${style.textColor} truncate flex-1`} title={itemText}>
                        {itemText} {order.quantity > 1 ? `(${order.quantity}x)` : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUNA 3: RETIRADAS */}
          <div className="bg-slate-900/80 rounded-xl border border-blue-500/40 p-2 flex flex-col shadow-inner min-h-0">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-blue-500/25 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
                  RETIRADAS
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-950/80 px-2 py-0.2 rounded border border-blue-500/30">
                {deliveredList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {deliveredList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium">
                  Nenhum pedido retirado ainda
                </div>
              ) : (
                deliveredList.map((order) => {
                  const style = getOrderCategoryStyle(order);
                  const itemText = getItemSummary(order);
                  return (
                    <div 
                      key={order.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${style.border} ${style.bg} transition-all shadow-sm text-xs`}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        {style.icon}
                        <span className={`font-mono font-black text-[11px] px-1.5 py-0.2 rounded border ${style.badgeColor}`}>
                          {order.orderNumber}
                        </span>
                      </div>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className="text-[11px] font-black text-white uppercase truncate max-w-[85px] sm:max-w-[110px]" title={order.customerName}>
                        {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'}
                      </span>

                      <span className="text-slate-600 font-bold select-none text-[10px]">|</span>

                      <span className={`text-[10px] font-bold ${style.textColor} truncate flex-1`} title={itemText}>
                        {itemText} {order.quantity > 1 ? `(${order.quantity}x)` : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </footer>

    </div>
  );
}
