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
  Disc,
  Utensils,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { storageService } from '../services/storage';
import ProfileSelector from './ProfileSelector';
import AutoToast from './AutoToast';

export default function CashierView({ environment, onOpenConfig, onNavigate }) {
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

  // MODAIS RÁPIDOS NA LINHA DA CATEGORIA: + (VERDINHO BRILHO) E - (VERMELHO FOSCO)
  const [quickAddModal, setQuickAddModal] = useState({ isOpen: false, category: null });
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('0,00');
  const [quickAddPrefix, setQuickAddPrefix] = useState('');
  const [quickAddDesc, setQuickAddDesc] = useState('');

  const [quickDeleteModal, setQuickDeleteModal] = useState({ isOpen: false, category: null, itemToDelete: null });

  // Máscara monetária em Reais 0,00
  const formatCurrencyMask = (val) => {
    if (val === undefined || val === null || val === '') return '0,00';
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '0,00';
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrencyMask = (maskedVal) => {
    if (!maskedVal) return 0;
    if (typeof maskedVal === 'number') return maskedVal;
    const digits = String(maskedVal).replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  };

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

    const handleProductsEvt = (e) => {
      setCategories(e.detail || storageService.getProducts());
    };
    window.addEventListener('cantina_products_changed', handleProductsEvt);

    return () => {
      unsubscribeOrders();
      unsubscribeStatus();
      window.removeEventListener('cantina_event_changed', handleEvt);
      window.removeEventListener('cantina_products_changed', handleProductsEvt);
    };
  }, []);

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (quickDeleteModal.isOpen) {
          setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null });
          return;
        }
        if (quickAddModal.isOpen) {
          setQuickAddModal({ isOpen: false, category: null });
          return;
        }
        if (selectedProduct || selectedPizzaFlavor) {
          cancelSelection();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickDeleteModal.isOpen, quickAddModal.isOpen, selectedProduct, selectedPizzaFlavor]);

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
    setCustomerName('');
    setQuantity(1);
    setShowNameError(false);
    setTimeout(() => nameInputRef.current?.focus(), 60);
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
    setCustomerName('');
    setQuantity(1);
    setShowNameError(false);
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

    // Determina o destino de produção a partir das configurações
    const routing = storageService.getProductionRouting();
    const targetId = variation ? variation.id : item.id;
    const catId = category.id;

    let sendToKitchen = true;
    if (routing.sendToKitchen?.[targetId] !== undefined) {
      sendToKitchen = routing.sendToKitchen[targetId];
    } else if (routing.sendToKitchen?.[catId] !== undefined) {
      sendToKitchen = routing.sendToKitchen[catId];
    } else {
      sendToKitchen = catId === 'pizza';
    }

    // Destino do ambiente de preparo (Cozinha 1, Cozinha 2, Tenda, Quadra, etc.)
    let targetEnvironment = 'COZINHA';
    if (routing.destinationEnv?.[targetId] !== undefined) {
      targetEnvironment = routing.destinationEnv[targetId];
    } else if (routing.destinationEnv?.[catId] !== undefined) {
      targetEnvironment = routing.destinationEnv[catId];
    } else {
      targetEnvironment = sendToKitchen ? 'COZINHA' : 'none';
    }

    if (targetEnvironment === 'none') {
      sendToKitchen = false;
    } else {
      sendToKitchen = true;
    }

    let showOnTV = true;
    if (routing.showOnTV?.[targetId] !== undefined) {
      showOnTV = routing.showOnTV[targetId];
    } else if (routing.showOnTV?.[catId] !== undefined) {
      showOnTV = routing.showOnTV[catId];
    } else {
      showOnTV = catId === 'pizza';
    }

    const newOrder = {
      orderNumber,
      customerName: cleanName,
      category: category.id,
      categoryName: category.name,
      itemId: item.id,
      itemName: item.name,
      variationId: variation ? variation.id : null,
      variationName: variation ? variation.name : null,
      fullDescription: description,
      quantity: qty,
      unitPrice,
      totalPrice,
      paymentMethod,
      sendToKitchen,
      targetEnvironment,
      showOnTV,
      status: sendToKitchen ? 'em_preparo' : 'entregue'
    };

    try {
      const created = await storageService.createOrder(newOrder);

      // Feedback visual em Modal Bonito de 2 Segundos
      setToast({
        type: 'success',
        title: sendToKitchen ? 'Pedido Enviado para a Cozinha!' : 'Venda Concluída (Tenda / Balcão)!',
        message: `Comanda ${created.orderNumber} confirmada!`,
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
    setSelectedPizzaFlavor(null);
    setSelectedProduct(null);
    setCustomerName('');
    setQuantity(1);
    setShowNameError(false);
  };

  // AÇÕES RÁPIDAS: ADICIONAR E EXCLUIR ITEM DIRETAMENTE NA CATEGORIA (BOTÕES + E -)
  const handleOpenQuickAdd = (category) => {
    if (!category) return;
    let defPrefix = category.prefixDefault || '';
    if (!defPrefix) {
      if (category.id === 'pizza') defPrefix = 'Pp-';
      else if (category.id === 'acai') defPrefix = 'A-';
      else if (category.id === 'batata') defPrefix = 'B-';
      else defPrefix = `${category.name.substring(0, 3).toUpperCase()}-`;
    }
    setQuickAddName('');
    setQuickAddPrice(category.id === 'pizza' ? '0,00' : '10,00');
    setQuickAddPrefix(defPrefix);
    setQuickAddDesc('');
    setQuickAddModal({ isOpen: true, category });
  };

  const handleSaveQuickAdd = (e) => {
    if (e) e.preventDefault();
    const cat = quickAddModal.category;
    if (!cat) return;

    const cleanName = quickAddName.trim();
    if (!cleanName) {
      setToast({
        title: 'Atenção',
        message: 'Por favor, digite o nome do item / sabor!',
        type: 'error'
      });
      return;
    }

    const priceNum = parseCurrencyMask(quickAddPrice);
    const cleanPrefix = quickAddPrefix.trim() || (cat.prefixDefault || `${cat.id.substring(0, 3).toUpperCase()}-`);
    const cleanDesc = quickAddDesc.trim();

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName.toUpperCase(),
      price: priceNum,
      prefix: cleanPrefix,
      description: cleanDesc
    };

    const updatedCategories = categories.map((c) => {
      if (c.id === cat.id) {
        return {
          ...c,
          items: [...(c.items || []), newItem]
        };
      }
      return c;
    });

    storageService.saveProducts(updatedCategories);
    setCategories(updatedCategories);
    setQuickAddModal({ isOpen: false, category: null });
    setToast({
      title: 'Item Adicionado!',
      message: `"${cleanName.toUpperCase()}" agora está disponível para venda em ${cat.name}!`,
      type: 'success'
    });
  };

  const handleOpenQuickDelete = (category) => {
    if (!category) return;
    setQuickDeleteModal({ isOpen: true, category, itemToDelete: null });
  };

  const handleConfirmQuickDelete = (item) => {
    const cat = quickDeleteModal.category;
    if (!cat || !item) return;

    const updatedCategories = categories.map((c) => {
      if (c.id === cat.id) {
        return {
          ...c,
          items: (c.items || []).filter((it) => it.id !== item.id)
        };
      }
      return c;
    });

    storageService.saveProducts(updatedCategories);
    setCategories(updatedCategories);

    // Se o item deletado for o atualmente selecionado no caixa, limpa a seleção
    if (selectedPizzaFlavor?.id === item.id) setSelectedPizzaFlavor(null);
    if (selectedProduct?.item?.id === item.id) cancelSelection();

    setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null });
    setToast({
      title: 'Item Excluído!',
      message: `"${item.name}" foi removido de ${cat.name}!`,
      type: 'info'
    });
  };

  const handleDeleteCategory = (cat) => {
    if (!cat) return;
    if (['pizza', 'acai', 'batata'].includes(cat.id)) {
      setToast({
        title: 'Atenção',
        message: 'Categorias padrão do sistema não podem ser excluídas.',
        type: 'error'
      });
      return;
    }

    const updatedCategories = categories.filter((c) => c.id !== cat.id);
    storageService.saveProducts(updatedCategories);
    setCategories(updatedCategories);

    if (selectedProduct?.category?.id === cat.id) {
      cancelSelection();
    }

    setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null });
    setToast({
      title: 'Categoria Excluída!',
      message: `A categoria "${cat.name}" foi excluída com sucesso!`,
      type: 'success'
    });
  };

  const pizzaCategory = categories.find(c => c.id === 'pizza');
  const acaiCategory = categories.find(c => c.id === 'acai');
  const batataCategory = categories.find(c => c.id === 'batata');
  const otherCategories = categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id));

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
            onProfileChange={(profileId) => {
              if (onNavigate) onNavigate(profileId);
            }}
            onOpenConfig={onOpenConfig}
          />
        </div>
      </header>

      {/* MODAL BONITO RÁPIDO (1 SEGUNDO) */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={1000} />

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
                  PIZZA
                </h2>
              </div>

              {/* BOTÕES + VERDINHO BRILHO E - VERMELHO FOSCO (REDONDOS SEM CAPTION) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(pizzaCategory)}
                  title="Adicionar novo sabor / opção de pizza"
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-md shadow-emerald-500/40 hover:shadow-emerald-400/60 border border-emerald-300/50 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickDelete(pizzaCategory)}
                  title="Excluir sabor de pizza"
                  className="w-6 h-6 rounded-full bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/70 hover:border-rose-600/80 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* BOTÕES DOS SABORES DE PIZZA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {pizzaCategory.items.map((flavor) => {
                const isSelected = selectedPizzaFlavor?.id === flavor.id;
                return (
                  <button
                    key={flavor.id}
                    onClick={() => handleSelectPizzaFlavor(flavor)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] ${
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

            {/* AO CLICAR NO SABOR: BARRA DE 1 LINHA APENAS */}
            {selectedPizzaFlavor ? (
              <div 
                ref={drawerRef}
                className="mt-2.5 p-2 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-emerald-500/80 shadow-2xl animate-curtain-down relative pr-9"
              >
                {/* BOTÃO X FECHAR NO CANTO SUPERIOR DIREITO */}
                <button
                  type="button"
                  onClick={cancelSelection}
                  className="absolute top-2.5 right-2 text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer z-10"
                  title="Fechar e cancelar escolha"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* EM 1 LINHA APENAS: PEDAÇO/INTEIRA | NOME | QDTE | PAGAMENTO | ENVIAR */}
                <form 
                  onSubmit={handleConfirmAndSend}
                  className="flex flex-row items-center gap-2 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex-nowrap overflow-x-auto"
                >
                  {/* À ESQ: PEDAÇO E INTEIRA (SEM PP-XX E SEM 'SELECIONADO', COR MUDA QUANDO SELECIONA) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pizzaCategory.variations.map((variation) => {
                      const isPedaco = variation.id === 'pedaco';
                      const isCurrentChoice = selectedProduct?.variation?.id === variation.id;

                      return (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() => handleSelectPizzaVariation(variation)}
                          className={`h-10 px-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer select-none ${
                            isCurrentChoice
                              ? isPedaco
                                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow ring-2 ring-amber-400 font-black'
                                : 'bg-red-600 text-white border-red-300 shadow ring-2 ring-red-400 font-black'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 font-bold'
                          }`}
                        >
                          {isPedaco ? (
                            <Pizza className={`w-4 h-4 shrink-0 ${isCurrentChoice ? 'text-slate-950' : 'text-amber-400'}`} />
                          ) : (
                            <Disc className={`w-4 h-4 shrink-0 ${isCurrentChoice ? 'text-white' : 'text-red-400'}`} />
                          )}
                          <span className="text-xs uppercase tracking-wide">{variation.name}</span>
                          <span className={`text-xs font-mono font-black ${isCurrentChoice ? (isPedaco ? 'text-slate-950' : 'text-white') : 'text-amber-300'}`}>
                            R$ {variation.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* NOME (RETIRE 'DE QUEM COMPROU') */}
                  <div className={`flex-1 min-w-[170px] relative ${nameShake ? 'animate-shake' : ''}`}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="NOME *"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value.toUpperCase());
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
                      className={`w-full h-10 bg-slate-950 text-white text-xs sm:text-sm font-bold uppercase px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:normal-case placeholder:text-xs border-2 ${
                        !isNameFilled 
                          ? 'border-rose-500 glow-required-name' 
                          : 'border-emerald-500 ring-2 ring-emerald-500/30'
                      }`}
                    />
                  </div>

                  {/* QDTE (PEQUENO) */}
                  <div className="w-24 sm:w-28 shrink-0">
                    <div className="h-10 flex items-center justify-between bg-slate-950 px-1.5 rounded-xl border border-slate-700">
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
                        className="w-8 text-center bg-transparent text-sm font-black text-amber-300 outline-none"
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
                  <div className="w-24 sm:w-28 shrink-0">
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
                      className="w-full h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all cursor-pointer"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="DEBITO">Débito</option>
                      <option value="CREDITO">Crédito</option>
                    </select>
                  </div>

                  {/* BOTÃO ENVIAR (RETIRE 'PARA A COZINHA') */}
                  <div className="shrink-0">
                    <button
                      ref={submitButtonRef}
                      type="submit"
                      className="h-10 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                    >
                      <Send className="w-4 h-4 fill-current" />
                      <span>ENVIAR</span>
                      <span className="ml-0.5 bg-slate-950/25 px-1.5 py-0.5 rounded font-mono text-xs font-black">
                        R$ {((selectedProduct?.variation?.price || 0) * quantity).toFixed(2)}
                      </span>
                    </button>
                  </div>
                </form>

                {showNameError && (
                  <div className="text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Por favor, digite o nome para enviar!</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ
           ======================================================== */}
        {acaiCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30">
                  <IceCream className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  AÇAÍ
                </h2>
              </div>

              {/* BOTÕES + VERDINHO BRILHO E - VERMELHO FOSCO (REDONDOS SEM CAPTION) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(acaiCategory)}
                  title="Adicionar nova opção de Açaí (ex: Copo 500ml)"
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-md shadow-emerald-500/40 hover:shadow-emerald-400/60 border border-emerald-300/50 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickDelete(acaiCategory)}
                  title="Excluir opção de Açaí"
                  className="w-6 h-6 rounded-full bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/70 hover:border-rose-600/80 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* CARDS DE AÇAÍ: MESMA ALTURA E FORMATO DE PIZZA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {acaiCategory.items.map((item) => {
                const isSelected = selectedProduct?.category?.id === 'acai' && selectedProduct?.item?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDirectItem(acaiCategory, item)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] ${
                      isSelected
                        ? 'bg-purple-800 text-white border-purple-400 shadow ring-2 ring-purple-400 scale-[1.01]'
                        : 'bg-slate-900/90 hover:bg-purple-950/70 text-slate-200 border-slate-700 hover:border-purple-500/70'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                      <div className="text-[10px] text-purple-300 font-mono font-bold mt-0.5">R$ {item.price.toFixed(2)}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${isSelected ? 'bg-purple-950 text-purple-200 border border-purple-400/40' : 'bg-slate-800 text-purple-400'}`}>
                        {isSelected ? '✓ Selecionado' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AO CLICAR NO AÇAÍ: BARRA DE 1 LINHA APENAS */}
            {selectedProduct?.category?.id === 'acai' && (
              <div 
                ref={drawerRef}
                className="mt-2.5 p-2 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-purple-500/80 shadow-2xl animate-curtain-down relative pr-9"
              >
                {/* BOTÃO X FECHAR NO CANTO SUPERIOR DIREITO */}
                <button
                  type="button"
                  onClick={cancelSelection}
                  className="absolute top-2.5 right-2 text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer z-10"
                  title="Fechar e cancelar escolha"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* EM 1 LINHA APENAS: NOME | QDTE | PAGAMENTO | ENVIAR */}
                <form 
                  onSubmit={handleConfirmAndSend}
                  className="flex flex-row items-center gap-2 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex-nowrap overflow-x-auto"
                >
                  {/* NOME */}
                  <div className={`flex-1 min-w-[150px] relative shrink-0 ${nameShake ? 'animate-shake' : ''}`}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="NOME *"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value.toUpperCase());
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
                      className={`w-full h-10 bg-slate-950 text-white text-xs sm:text-sm font-bold uppercase px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:normal-case placeholder:text-xs border-2 ${
                        !isNameFilled 
                          ? 'border-rose-500 glow-required-name' 
                          : 'border-emerald-500 ring-2 ring-emerald-500/30'
                      }`}
                    />
                  </div>

                  {/* QDTE (PEQUENO) */}
                  <div className="w-24 shrink-0">
                    <div className="h-10 flex items-center justify-between bg-slate-950 px-1 rounded-xl border border-slate-700">
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
                        className="w-7 text-center bg-transparent text-sm font-black text-purple-300 outline-none"
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
                  <div className="w-24 shrink-0">
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
                      className="w-full h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all cursor-pointer"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="DEBITO">Débito</option>
                      <option value="CREDITO">Crédito</option>
                    </select>
                  </div>

                  {/* BOTÃO ENVIAR */}
                  <div className="shrink-0">
                    <button
                      ref={submitButtonRef}
                      type="submit"
                      className="h-10 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                    >
                      <Send className="w-4 h-4 fill-current" />
                      <span>ENVIAR</span>
                      <span className="ml-0.5 bg-slate-950/25 px-1.5 py-0.5 rounded font-mono text-xs font-black">
                        R$ {((selectedProduct?.item?.price || 0) * quantity).toFixed(2)}
                      </span>
                    </button>
                  </div>
                </form>

                {showNameError && (
                  <div className="text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Por favor, digite o nome para enviar!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 3: BATATA
           ======================================================== */}
        {batataCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-yellow-500/20 text-yellow-400 rounded-md border border-yellow-500/30">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  BATATA
                </h2>
              </div>

              {/* BOTÕES + VERDINHO BRILHO E - VERMELHO FOSCO (REDONDOS SEM CAPTION) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(batataCategory)}
                  title="Adicionar nova opção de Batata"
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-md shadow-emerald-500/40 hover:shadow-emerald-400/60 border border-emerald-300/50 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickDelete(batataCategory)}
                  title="Excluir opção de Batata"
                  className="w-6 h-6 rounded-full bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/70 hover:border-rose-600/80 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* CARDS DE BATATA: MESMA ALTURA E FORMATO DE PIZZA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {batataCategory.items.map((item) => {
                const isSelected = selectedProduct?.category?.id === 'batata' && selectedProduct?.item?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDirectItem(batataCategory, item)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] ${
                      isSelected
                        ? 'bg-yellow-500 text-slate-950 border-yellow-300 shadow ring-2 ring-yellow-400 scale-[1.01]'
                        : 'bg-slate-900/90 hover:bg-yellow-950/70 text-slate-200 border-slate-700 hover:border-yellow-500/70'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                      <div className="text-[10px] text-yellow-300 font-mono font-bold mt-0.5">R$ {item.price.toFixed(2)}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${isSelected ? 'bg-slate-950 text-yellow-300 border border-yellow-400/40' : 'bg-slate-800 text-yellow-400'}`}>
                        {isSelected ? '✓ Selecionado' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AO CLICAR NA BATATA: BARRA DE 1 LINHA APENAS */}
            {selectedProduct?.category?.id === 'batata' && (
              <div 
                ref={drawerRef}
                className="mt-2.5 p-2 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-yellow-500/80 shadow-2xl animate-curtain-down relative pr-9"
              >
                {/* BOTÃO X FECHAR NO CANTO SUPERIOR DIREITO */}
                <button
                  type="button"
                  onClick={cancelSelection}
                  className="absolute top-2.5 right-2 text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer z-10"
                  title="Fechar e cancelar escolha"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* EM 1 LINHA APENAS: NOME | QDTE | PAGAMENTO | ENVIAR */}
                <form 
                  onSubmit={handleConfirmAndSend}
                  className="flex flex-row items-center gap-2 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex-nowrap overflow-x-auto"
                >
                  {/* NOME */}
                  <div className={`flex-1 min-w-[150px] relative shrink-0 ${nameShake ? 'animate-shake' : ''}`}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="NOME *"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value.toUpperCase());
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
                      className={`w-full h-10 bg-slate-950 text-white text-xs sm:text-sm font-bold uppercase px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:normal-case placeholder:text-xs border-2 ${
                        !isNameFilled 
                          ? 'border-rose-500 glow-required-name' 
                          : 'border-emerald-500 ring-2 ring-emerald-500/30'
                      }`}
                    />
                  </div>

                  {/* QDTE (PEQUENO) */}
                  <div className="w-24 shrink-0">
                    <div className="h-10 flex items-center justify-between bg-slate-950 px-1 rounded-xl border border-slate-700">
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
                        className="w-7 text-center bg-transparent text-sm font-black text-yellow-300 outline-none"
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
                  <div className="w-24 shrink-0">
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
                      className="w-full h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2 rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 transition-all cursor-pointer"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="DEBITO">Débito</option>
                      <option value="CREDITO">Crédito</option>
                    </select>
                  </div>

                  {/* BOTÃO ENVIAR */}
                  <div className="shrink-0">
                    <button
                      ref={submitButtonRef}
                      type="submit"
                      className="h-10 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                    >
                      <Send className="w-4 h-4 fill-current" />
                      <span>ENVIAR</span>
                      <span className="ml-0.5 bg-slate-950/25 px-1.5 py-0.5 rounded font-mono text-xs font-black">
                        R$ {((selectedProduct?.item?.price || 0) * quantity).toFixed(2)}
                      </span>
                    </button>
                  </div>
                </form>

                {showNameError && (
                  <div className="text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Por favor, digite o nome para enviar!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 4: OUTRAS CATEGORIAS / ITENS ADICIONADOS
           ======================================================== */}
        {otherCategories.map((cat) => (
          <div key={cat.id} className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-cyan-500/20 text-cyan-400 rounded-md border border-cyan-500/30">
                  <Utensils className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  {cat.name}
                </h2>
              </div>

              {/* BOTÕES + VERDINHO BRILHO E - VERMELHO FOSCO (REDONDOS SEM CAPTION) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(cat)}
                  title={`Adicionar opções de ${cat.name}`}
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-md shadow-emerald-500/40 hover:shadow-emerald-400/60 border border-emerald-300/50 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickDelete(cat)}
                  title={`Excluir opções ou categoria ${cat.name}`}
                  className="w-6 h-6 rounded-full bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/70 hover:border-rose-600/80 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* CARDS: MESMA ALTURA E FORMATO DE PIZZA */}
            {(!cat.items || cat.items.length === 0) ? (
              <div className="py-3 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-lg border border-dashed border-slate-700/80">
                Nenhum item cadastrado em {cat.name}. Clique no botão <strong className="text-emerald-400 font-bold">+ Adicionar</strong> acima para cadastrar!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {cat.items.map((item) => {
                const isSelected = selectedProduct?.category?.id === cat.id && selectedProduct?.item?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDirectItem(cat, item)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow ring-2 ring-cyan-400 scale-[1.01]'
                        : 'bg-slate-900/90 hover:bg-cyan-950/70 text-slate-200 border-slate-700 hover:border-cyan-500/70'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                      <div className="text-[10px] text-cyan-300 font-mono font-bold mt-0.5">R$ {item.price.toFixed(2)}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${isSelected ? 'bg-slate-950 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-cyan-400'}`}>
                        {isSelected ? '✓ Selecionado' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            )}

            {/* AO CLICAR NO ITEM: BARRA DE 1 LINHA APENAS */}
            {selectedProduct?.category?.id === cat.id && (
              <div 
                ref={drawerRef}
                className="mt-2.5 p-2 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-cyan-500/80 shadow-2xl animate-curtain-down relative pr-9"
              >
                {/* BOTÃO X FECHAR NO CANTO SUPERIOR DIREITO */}
                <button
                  type="button"
                  onClick={cancelSelection}
                  className="absolute top-2.5 right-2 text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer z-10"
                  title="Fechar e cancelar escolha"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* EM 1 LINHA APENAS: NOME | QDTE | PAGAMENTO | ENVIAR */}
                <form 
                  onSubmit={handleConfirmAndSend}
                  className="flex flex-row items-center gap-2 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex-nowrap overflow-x-auto"
                >
                  {/* NOME */}
                  <div className={`flex-1 min-w-[150px] relative shrink-0 ${nameShake ? 'animate-shake' : ''}`}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="NOME *"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value.toUpperCase());
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
                      className={`w-full h-10 bg-slate-950 text-white text-xs sm:text-sm font-bold uppercase px-3 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:normal-case placeholder:text-xs border-2 ${
                        !isNameFilled 
                          ? 'border-rose-500 glow-required-name' 
                          : 'border-emerald-500 ring-2 ring-emerald-500/30'
                      }`}
                    />
                  </div>

                  {/* QDTE (PEQUENO) */}
                  <div className="w-24 shrink-0">
                    <div className="h-10 flex items-center justify-between bg-slate-950 px-1 rounded-xl border border-slate-700">
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
                        className="w-7 text-center bg-transparent text-sm font-black text-cyan-300 outline-none"
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
                  <div className="w-24 shrink-0">
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
                      className="w-full h-10 bg-slate-950 border border-slate-700 text-white font-black text-xs px-2 rounded-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all cursor-pointer"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="DEBITO">Débito</option>
                      <option value="CREDITO">Crédito</option>
                    </select>
                  </div>

                  {/* BOTÃO ENVIAR */}
                  <div className="shrink-0">
                    <button
                      ref={submitButtonRef}
                      type="submit"
                      className="h-10 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border-2 border-emerald-300 glow-btn-focused"
                    >
                      <Send className="w-4 h-4 fill-current" />
                      <span>ENVIAR</span>
                      <span className="ml-0.5 bg-slate-950/25 px-1.5 py-0.5 rounded font-mono text-xs font-black">
                        R$ {((selectedProduct?.item?.price || 0) * quantity).toFixed(2)}
                      </span>
                    </button>
                  </div>
                </form>

                {showNameError && (
                  <div className="text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Por favor, digite o nome para enviar!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
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

      {/* MODAL RÁPIDO: ADICIONAR OPÇÃO DE PRODUTO (+ VERDINHO BRILHO) */}
      {quickAddModal.isOpen && quickAddModal.category && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase">
                    Adicionar Opção em {quickAddModal.category.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre uma nova opção para venda imediata no caixa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddModal({ isOpen: false, category: null })}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {quickAddModal.category.id === 'pizza' ? 'Sabor da Pizza: *' : 'Nome da Opção: *'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    quickAddModal.category.id === 'pizza'
                      ? 'Ex: Quatro Queijos, Bacon Especial...'
                      : quickAddModal.category.id === 'acai'
                      ? 'Ex: Copo 500ml, Tigela 700ml...'
                      : 'Ex: Porção Grande, Lata 350ml...'
                  }
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Preço de Venda (R$): *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-emerald-400">
                    <span className="text-xs font-bold text-emerald-400 mr-1.5">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={quickAddPrice}
                      onChange={(e) => setQuickAddPrice(formatCurrencyMask(e.target.value))}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prefixo Senha: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A-, B-, Pp-"
                    value={quickAddPrefix}
                    onChange={(e) => setQuickAddPrefix(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Acompanha granola e leite condensado..."
                  value={quickAddDesc}
                  onChange={(e) => setQuickAddDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ isOpen: false, category: null })}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Adicionar Opção</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR ITEM OU CATEGORIA (- VERMELHO FOSCO) */}
      {quickDeleteModal.isOpen && quickDeleteModal.category && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-rose-400 tracking-wide uppercase">
                    Excluir em {quickDeleteModal.category.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Escolha qual item quer excluir ou exclua a categoria inteira
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null })}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SE UM ITEM FOI SELECIONADO PARA EXCLUSÃO: CONFIRMAÇÃO */}
            {quickDeleteModal.itemToDelete ? (
              <div className="bg-rose-950/30 border border-rose-500/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <p className="text-sm font-bold text-slate-200 leading-relaxed">
                  Tem certeza que deseja excluir o item <strong className="text-rose-400 uppercase">"{quickDeleteModal.itemToDelete.name}"</strong>? Ele deixará de aparecer para venda no caixa.
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Valor:</span>
                  <span className="font-black text-emerald-400">R$ {formatCurrencyMask(quickDeleteModal.itemToDelete.price)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickDeleteModal(prev => ({ ...prev, itemToDelete: null }))}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    NÃO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmQuickDelete(quickDeleteModal.itemToDelete)}
                    className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>SIM, EXCLUIR ITEM</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DUAS OPÇÕES: EXCLUIR CATEGORIA INTEIRA OU ESCOLHER QUAL ITEM EXCLUIR */
              <div className="space-y-3.5">
                
                {/* OPÇÃO 1: EXCLUIR TODA A CATEGORIA (SE FOR CATEGORIA PERSONALIZADA) */}
                {!['pizza', 'acai', 'batata'].includes(quickDeleteModal.category.id) && (
                  <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                    <div className="min-w-0">
                      <div className="font-black text-xs text-rose-300 uppercase flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="truncate">Excluir Categoria {quickDeleteModal.category.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Apaga esta categoria inteira do cardápio e caixa
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(quickDeleteModal.category)}
                      className="py-2 px-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Categoria</span>
                    </button>
                  </div>
                )}

                {/* OPÇÃO 2: LISTAGEM DE ITENS DA CATEGORIA PARA ESCOLHER QUAL EXCLUIR */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-300 uppercase tracking-wide flex items-center justify-between">
                    <span>Escolha qual item quer excluir:</span>
                    {quickDeleteModal.category.items?.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({quickDeleteModal.category.items.length} {quickDeleteModal.category.items.length === 1 ? 'item' : 'itens'})
                      </span>
                    )}
                  </div>

                  {(!quickDeleteModal.category.items || quickDeleteModal.category.items.length === 0) ? (
                    <div className="py-4 text-center text-slate-400 text-xs italic bg-slate-950/40 rounded-xl border border-slate-800">
                      Nenhum item individual cadastrado nesta categoria.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {quickDeleteModal.category.items.map((it) => (
                        <div
                          key={it.id}
                          className="bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-rose-500/60 p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all group"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white uppercase truncate">
                              {it.name}
                            </div>
                            <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
                              R$ {formatCurrencyMask(it.price)}
                              {it.prefix && <span className="text-slate-500 font-normal ml-2">Prefixo: {it.prefix}</span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setQuickDeleteModal(prev => ({ ...prev, itemToDelete: it }))}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-rose-950/50 cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null })}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
