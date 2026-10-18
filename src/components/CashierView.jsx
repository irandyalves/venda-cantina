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
  Trash2,
  Check
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

  // ========================================================
  // NOVO FLUXO DE ATENDIMENTO AO CLIENTE (MULTI-PEDIDOS)
  // 1º Passo: Digita o Nome do Cliente e escolhe a forma de pagamento
  // 2º Passo: Clica nos produtos (Pastel, Batata, Pizza...) e vai montando a comanda
  // ========================================================
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  
  // Itens da comanda do cliente:
  // Array de { cartItemId, category, item, variation, description, prefix, unitPrice, quantity }
  const [cart, setCart] = useState([]);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);

  // Sabor de pizza ativo para escolha de Pedaço ou Inteira
  const [selectedPizzaFlavor, setSelectedPizzaFlavor] = useState(null);

  // Validação e feedback
  const [nameShake, setNameShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [toast, setToast] = useState(null);

  // Modais rápidos na linha da categoria: + (verde) e - (vermelho)
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
      const deltaY = startDragYRef.current - clientY;
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

  // Fechar modais / limpar seleções com tecla ESC
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
        if (selectedPizzaFlavor) {
          setSelectedPizzaFlavor(null);
          return;
        }
        if (cart.length > 0) {
          setCart([]);
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickDeleteModal.isOpen, quickAddModal.isOpen, selectedPizzaFlavor, cart.length]);

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

  // Cores de fundo e borda para cada categoria de item (identados no rodapé)
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

  const rawPreparing = sortNewestFirst(todayOrders.filter(o => o.status === 'em_preparo'));
  const rawReady = sortNewestFirst(todayOrders.filter(o => o.status === 'pronto'));
  const rawDelivered = sortNewestFirst(todayOrders.filter(o => o.status === 'entregue'));

  const preparingList = groupOrdersForDisplay(rawPreparing);
  const readyList = groupOrdersForDisplay(rawReady);
  const deliveredList = groupOrdersForDisplay(rawDelivered);

  const totalFaturado = todayOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  // Cores distintas para Pizza, Açaí e Batata nos Cards do Rodapé
  const getOrderCategoryStyle = (order) => {
    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (cat.includes('pizza') || cat.includes('ped') || cat.includes('int')) {
      return {
        icon: <Pizza className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
        border: 'border-yellow-500/50 hover:border-yellow-400',
        bg: 'bg-yellow-950/40 hover:bg-yellow-950/60',
        badgeColor: 'text-yellow-300 bg-yellow-950/90 border-yellow-500/50',
        textColor: 'text-yellow-200'
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
        icon: <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
        border: 'border-orange-500/50 hover:border-orange-400',
        bg: 'bg-orange-950/40 hover:bg-orange-950/60',
        badgeColor: 'text-orange-300 bg-orange-950/90 border-orange-500/50',
        textColor: 'text-orange-200'
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

  // ========================================================
  // LÓGICA DA COMANDA DO CLIENTE (CARRINHO MULTI-ITENS)
  // ========================================================

  // Adicionar pizza com variação (Pedaço ou Inteira) à comanda
  const handleAddPizzaToCart = (flavor, variation) => {
    const pizzaCat = categories.find(c => c.id === 'pizza');
    const isPedaco = variation.id === 'pedaco';
    const prefix = variation.prefix || (isPedaco ? 'Pp-' : 'Pi-');
    const unitPrice = variation.price;
    const description = `${variation.name.toUpperCase()}: ${flavor.name}`;
    const cartItemId = `pizza_${flavor.id}_${variation.id}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.cartItemId === cartItemId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, {
        cartItemId,
        category: pizzaCat,
        item: flavor,
        variation,
        description,
        prefix,
        unitPrice,
        quantity: 1
      }];
    });

    if (!customerName.trim()) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  };

  // Adicionar item direto (Batata, Açaí, Salgados, Bebidas, etc.) à comanda
  const handleAddItemToCart = (category, item) => {
    const prefix = item.prefix || category.prefixDefault || 'Ped-';
    const unitPrice = item.price || 0;
    const description = item.name;
    const cartItemId = `${category.id}_${item.id}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.cartItemId === cartItemId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, {
        cartItemId,
        category,
        item,
        variation: null,
        description,
        prefix,
        unitPrice,
        quantity: 1
      }];
    });

    if (!customerName.trim()) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.cartItemId === cartItemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Helper para saber quantos itens de um sabor/produto estão na comanda
  const getItemCartQuantity = (itemId) => {
    const matches = cart.filter(i => i.item.id === itemId);
    return matches.reduce((sum, i) => sum + i.quantity, 0);
  };




  // Finalizar a comanda do cliente: A SENHA É ÚNICA PARA TODA A COMPRA!
  const handleFinalizeCart = async (e) => {
    if (e) e.preventDefault();

    const cleanName = customerName.trim();
    if (!cleanName) {
      setNameShake(true);
      setShowNameError(true);
      nameInputRef.current?.focus();
      setTimeout(() => setNameShake(false), 500);
      return;
    }

    if (cart.length === 0) {
      setToast({
        type: 'error',
        title: 'Comanda Vazia',
        message: 'Clique nos produtos para adicionar ao pedido de ' + cleanName
      });
      return;
    }

    setShowNameError(false);
    setIsSubmittingCart(true);

    try {
      const routing = storageService.getProductionRouting();
      
      // A SENHA É ÚNICA: Assume a primeira senha (prefixo do 1º item)
      const primaryOrderNumber = storageService.getNextOrderNumber(cart[0].prefix);

      const orderItems = cart.map((cartItem) => {
        const { category, item, variation, description, prefix, unitPrice, quantity: qty } = cartItem;
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

        let targetEnvironment = 'COZINHA';
        if (routing.destinationEnv?.[targetId] !== undefined) {
          targetEnvironment = routing.destinationEnv[targetId];
        } else if (routing.destinationEnv?.[catId] !== undefined) {
          targetEnvironment = routing.destinationEnv[catId];
        } else {
          targetEnvironment = sendToKitchen ? 'COZINHA' : 'none';
        }

        return {
          cartItemId: cartItem.cartItemId,
          categoryId: category.id,
          categoryName: category.name,
          itemId: item.id,
          itemName: item.name,
          variationId: variation ? variation.id : null,
          variationName: variation ? variation.name : null,
          description,
          prefix,
          quantity: qty,
          unitPrice,
          totalPrice: unitPrice * qty,
          sendToKitchen,
          targetEnvironment
        };
      });

      const newOrder = {
        orderNumber: primaryOrderNumber, // SENHA ÚNICA
        customerName: cleanName,
        paymentMethod,
        items: orderItems,
        category: cart[0].category.id,
        categoryName: cart[0].category.name,
        itemId: cart[0].item.id,
        itemName: cart[0].item.name,
        fullDescription: orderItems.map(it => `${String(it.quantity).padStart(2, '0')} ${it.description}`).join(' | '),
        quantity: cartItemCount,
        unitPrice: cart[0].unitPrice,
        totalPrice: cartTotal,
        paymentMethod,
        sendToKitchen: true,
        targetEnvironment: 'COZINHA',
        showOnTV: true,
        status: 'em_preparo'
      };

      const created = await storageService.createOrder(newOrder);

      setToast({
        type: 'success',
        title: `Venda de ${cleanName.toUpperCase()} Concluída!`,
        message: `Comanda ${created.orderNumber} gerada com ${orderItems.length} item(ns)!`,
        subtext: `Total: R$ ${cartTotal.toFixed(2)} (${paymentMethod})`
      });

      // Limpar tudo para o próximo cliente
      setCart([]);
      setCustomerName('');
      setSelectedPizzaFlavor(null);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        title: 'Erro ao Enviar Pedidos',
        message: 'Ocorreu uma falha ao registrar a venda.',
        subtext: err.message
      });
    } finally {
      setIsSubmittingCart(false);
    }
  };

    // AÇÕES RÁPIDAS: ADICIONAR E EXCLUIR ITEM DIRETAMENTE NA CATEGORIA (BOTÕES + E -)
  const handleOpenQuickAdd = (category) => {
    if (!category) return;
    setQuickAddModal({ isOpen: true, category });
    setQuickAddName('');
    setQuickAddPrice('0,00');
    setQuickAddPrefix(category.prefixDefault || (category.id === 'pizza' ? 'Pp-' : 'Ped-'));
    setQuickAddDesc('');
  };

  const handleConfirmQuickAdd = (e) => {
    e.preventDefault();
    const cat = quickAddModal.category;
    if (!cat) return;

    const cleanName = quickAddName.trim();
    if (!cleanName) return;

    const numericPrice = parseCurrencyMask(quickAddPrice);
    const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newItem = {
      id: newId,
      name: cleanName,
      price: numericPrice,
      prefix: quickAddPrefix.trim() || cat.prefixDefault || 'Ped-',
      description: quickAddDesc.trim() || cleanName
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

    if (selectedPizzaFlavor?.id === item.id) setSelectedPizzaFlavor(null);

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


  // Renderizador de card do rodapé com SENHA ÚNICA e itens consolidados no mesmo card
  const renderFooterCard = (order, isDelivered = false) => {
    const style = getOrderCategoryStyle(order);
    const items = order.items && order.items.length > 0 ? order.items : getOrderItems(order);

    return (
      <div 
        key={order.id || order.orderIds?.[0] || order.orderNumber}
        className={`px-3 py-2 rounded-xl border ${style.border} ${style.bg} transition-all shadow-md text-xs flex flex-col gap-1.5`}
      >
        {/* CABEÇALHO DO CARD: B-01 | JOÃO + VALOR TOTAL */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              {style.icon}
              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${style.badgeColor}`}>
                {order.orderNumber}
              </span>
            </div>

            <span className="text-slate-600 font-bold select-none text-xs">|</span>

            <span className="text-xs font-black text-white uppercase tracking-wider truncate" title={order.customerName}>
              {order.customerName}
            </span>
          </div>

          <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
            R$ {(Number(order.totalPrice) || 0).toFixed(2)}
          </span>
        </div>

        {/* ITENS NO FORMATO: 01 Cone Individual • 01 Copo 500ml açaí • 01 Copo 300ml açaí */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {items.map((it, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold shadow-xs ${getItemBadgeStyle(it.categoryId || it.category, it.description || it.name)}`}
            >
              <strong className="text-orange-400 font-mono font-black text-xs">
                {String(it.quantity).padStart(2, '0')}
              </strong>
              <span className="text-slate-100">
                {it.description || it.name || it.itemName}
              </span>
              {idx < items.length - 1 && (
                <span className="text-slate-400 font-black ml-1 select-none">•</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

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
          <div className="flex items-center justify-center px-1" title={isFirebaseOnline ? 'Conexão Nuvem Online' : 'Modo Local'}>
            <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          </div>

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
          BARRA DE ATENDIMENTO AO CLIENTE (FLUXO PEDIDO MULTI-ITENS)
          PRIMEIRO DIGITA O NOME DO CLIENTE, E DEPOIS ESCOLHE OS ITENS!
         ======================================================== */}
      <section className="bg-slate-950/95 border-b-2 border-amber-500/60 px-3 py-3.5 sm:py-4 shrink-0 shadow-xl z-20 min-h-[72px] flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          
          {/* 1. NOME DO CLIENTE & FORMA DE PAGAMENTO */}
          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
            <div className={`relative flex-1 min-w-[200px] ${nameShake ? 'animate-shake' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400">
                <User className="w-4 h-4" />
              </div>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="1º DIGITE O NOME DO CLIENTE (EX: JOÃO) *"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value.toUpperCase());
                  if (showNameError && e.target.value.trim()) setShowNameError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cart.length > 0 && customerName.trim()) {
                      handleFinalizeCart();
                    }
                  }
                }}
                className={`w-full h-11 bg-slate-900 text-white text-xs sm:text-sm font-black uppercase pl-9 pr-8 rounded-xl outline-none transition-all placeholder:text-amber-400/60 placeholder:normal-case placeholder:text-xs border-2 ${
                  !isNameFilled 
                    ? 'border-amber-500/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30' 
                    : 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                }`}
              />
              {customerName && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName('');
                    nameInputRef.current?.focus();
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* FORMA DE PAGAMENTO */}
            <div className="w-36 shrink-0">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 bg-slate-900 border-2 border-slate-700 text-white font-black text-xs px-2.5 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all cursor-pointer"
              >
                <option value="PIX">💳 PIX</option>
                <option value="DINHEIRO">💵 Dinheiro</option>
                <option value="DEBITO">💳 Débito</option>
                <option value="CREDITO">💳 Crédito</option>
              </select>
            </div>

            {/* BOTÃO LIMPAR PEDIDO SE HOUVER ITENS */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="h-11 px-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl border border-rose-800 transition-all flex items-center justify-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                title="Limpar todos os itens da comanda atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>

          {/* 2. TOTALIZADOR E BOTÃO FINALIZAR VENDA */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            <div className="h-11 bg-slate-900 px-3.5 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total:</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                R$ {cartTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFinalizeCart}
              disabled={isSubmittingCart || cart.length === 0}
              className={`h-11 px-4 sm:px-5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl border-2 active:scale-95 cursor-pointer ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 border-emerald-300 shadow-emerald-950/80'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Send className="w-4 h-4 fill-current" />
              <span>FINALIZAR PEDIDOS</span>
              {cart.length > 0 && (
                <span className="bg-slate-950/25 px-1.5 py-0.5 rounded font-mono text-xs font-black">
                  R$ {cartTotal.toFixed(2)}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* ITENS DA COMANDA ATUAL (CHIPS ROLÁVEIS COM QUANTIDADE E EXCLUIR) */}
        {cart.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-black uppercase text-amber-400 shrink-0 flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Comanda de {customerName || 'Cliente'}:</span>
            </span>

            {cart.map((cItem) => (
              <div
                key={cItem.cartItemId}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-xl flex items-center gap-2 shrink-0 shadow-sm transition-all"
              >
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {cItem.description}
                </span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  R$ {(cItem.unitPrice * cItem.quantity).toFixed(2)}
                </span>

                <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(cItem.cartItemId, -1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-black text-amber-300 px-1">
                    {cItem.quantity}x
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(cItem.cartItemId, 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(cItem.cartItemId)}
                  className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                  title="Remover item da comanda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showNameError && (
          <div className="mt-2 text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Por favor, digite o nome do cliente no campo acima antes de finalizar!</span>
          </div>
        )}
      </section>

      {/* CORPO PRINCIPAL COM OS PRODUTOS (SELEÇÃO DIRETA) */}
      <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-6">

        {/* ========================================================
            SEÇÃO 1: PIZZA (CLICOU NO SABOR -> ESCOLHE PEDAÇO OU INTEIRA)
           ======================================================== */}
        {pizzaCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
                  <Pizza className="w-5 h-5" />
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                  PIZZA
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Clique no sabor e adicione Pedaço ou Inteira à comanda)
                </span>
              </div>

              {/* BOTÕES + E - PARA PIZZA */}
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
                const inCartQty = getItemCartQuantity(flavor.id);
                return (
                  <button
                    key={flavor.id}
                    onClick={() => setSelectedPizzaFlavor(flavor)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] group ${
                      isSelected
                        ? 'bg-yellow-500 text-slate-950 border-yellow-300 shadow ring-2 ring-yellow-400 scale-[1.01]'
                        : 'bg-slate-900/90 hover:bg-yellow-950/70 text-slate-200 border-slate-700 hover:border-yellow-500/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-extrabold text-xs leading-tight">{flavor.name}</div>
                        {inCartQty > 0 && (
                          <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1 rounded-full shadow shrink-0">
                            ✓ {inCartQty}x
                          </span>
                        )}
                      </div>
                      <div className={`text-[9px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400 group-hover:text-yellow-200/80'}`}>
                        {flavor.description || 'Sabor tradicional'}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-end">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded transition-colors ${
                        isSelected 
                          ? 'bg-slate-950 text-yellow-300' 
                          : 'bg-slate-800 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-slate-950'
                      }`}>
                        {isSelected ? '✓ Selecionado' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* BARRA DE ESCOLHA DE VARIAÇÃO: PEDAÇO OU INTEIRA (ADICIONA DIRETO À COMANDA) */}
            {selectedPizzaFlavor && (
              <div className="mt-2.5 p-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-xl border-2 border-amber-500/80 flex items-center justify-between flex-wrap gap-2 animate-fadeIn shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-300">
                    Sabor: <strong className="text-white uppercase">{selectedPizzaFlavor.name}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    &bull; Clique para adicionar à comanda de <strong className="text-white">{customerName || 'Cliente'}</strong>:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {pizzaCategory.variations.map((variation) => {
                    const isPedaco = variation.id === 'pedaco';
                    return (
                      <button
                        key={variation.id}
                        type="button"
                        onClick={() => handleAddPizzaToCart(selectedPizzaFlavor, variation)}
                        className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs shadow-md active:scale-95 ${
                          isPedaco
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
                        }`}
                      >
                        {isPedaco ? <Pizza className="w-4 h-4" /> : <Disc className="w-4 h-4" />}
                        <span>+ {variation.name}</span>
                        <span className="ml-1 bg-slate-950/30 px-1.5 py-0.5 rounded font-mono text-[11px]">
                          R$ {variation.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedPizzaFlavor(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Fechar seleção"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ (CLICOU NO ITEM -> ADICIONA DIRETO À COMANDA)
           ======================================================== */}
        {acaiCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
                  <IceCream className="w-5 h-5" />
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                  AÇAÍ
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Clique para adicionar diretamente à comanda)
                </span>
              </div>

              {/* BOTÕES + E - PARA AÇAÍ */}
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

            {/* CARDS DE AÇAÍ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {acaiCategory.items.map((item) => {
                const inCartQty = getItemCartQuantity(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItemToCart(acaiCategory, item)}
                    className="p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] bg-slate-900/90 hover:bg-purple-950/70 text-slate-200 border-slate-700 hover:border-purple-500/70 active:scale-98"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                        {inCartQty > 0 && (
                          <span className="text-[9px] font-black bg-purple-500 text-white px-1.5 py-0.2 rounded-full shadow shrink-0">
                            ✓ {inCartQty}x
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] sm:text-sm font-mono font-black mt-0.5 text-purple-300">
                        R$ {item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-end">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors">
                        + Adicionar
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 3: BATATA FRITA (CLICOU NO ITEM -> ADICIONA DIRETO À COMANDA)
           ======================================================== */}
        {batataCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                  BATATA FRITA
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Clique para adicionar diretamente à comanda)
                </span>
              </div>

              {/* BOTÕES + E - PARA BATATA */}
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

            {/* CARDS DE BATATA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {batataCategory.items.map((item) => {
                const inCartQty = getItemCartQuantity(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItemToCart(batataCategory, item)}
                    className="p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] bg-slate-900/90 hover:bg-orange-950/70 text-slate-200 border-slate-700 hover:border-orange-500/70 active:scale-98"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                        {inCartQty > 0 && (
                          <span className="text-[9px] font-black bg-orange-500 text-slate-950 px-1.5 py-0.2 rounded-full shadow shrink-0">
                            ✓ {inCartQty}x
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] sm:text-sm font-mono font-black mt-0.5 text-orange-400">
                        R$ {item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-end">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 hover:bg-orange-500 text-orange-300 hover:text-white transition-colors">
                        + Adicionar
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 4: OUTRAS CATEGORIAS (PASTEL, SALGADOS, BEBIDAS...)
           ======================================================== */}
        {otherCategories.map((cat) => (
          <div key={cat.id} className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                  <Utensils className="w-5 h-5" />
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                  {cat.name}
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Clique para adicionar diretamente à comanda)
                </span>
              </div>

              {/* BOTÕES + E - PARA OUTRAS CATEGORIAS */}
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

            {/* CARDS DOS ITENS */}
            {(!cat.items || cat.items.length === 0) ? (
              <div className="py-3 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-lg border border-dashed border-slate-700/80">
                Nenhum item cadastrado em {cat.name}. Clique no botão <strong className="text-emerald-400 font-bold">+</strong> acima para cadastrar!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {cat.items.map((item) => {
                  const inCartQty = getItemCartQuantity(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddItemToCart(cat, item)}
                      className="p-2 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer min-h-[64px] bg-slate-900/90 hover:bg-cyan-950/70 text-slate-200 border-slate-700 hover:border-cyan-500/70 active:scale-98"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-extrabold text-xs leading-tight truncate">{item.name}</div>
                          {inCartQty > 0 && (
                            <span className="text-[9px] font-black bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded-full shadow shrink-0">
                              ✓ {inCartQty}x
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] sm:text-sm font-mono font-black mt-0.5 text-cyan-300">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center justify-end">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 transition-colors">
                          + Adicionar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* ========================================================
          RODAPÉ DO CAIXA: 3 COLUNAS REDIMENSIONÁVEIS (ARRASTAR LINHA SUPERIOR)
          - EM PREPARAÇÃO, PRONTAS, RETIRADAS
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

        {/* 3 COLUNAS: EM PREPARAÇÃO, PRONTAS, RETIRADAS */}
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
                preparingList.map(order => renderFooterCard(order, false))
              )}
            </div>
          </div>

          {/* COLUNA 2: PRONTAS */}
          <div className="bg-slate-900/80 rounded-xl border border-emerald-500/40 p-2 flex flex-col shadow-inner min-h-0">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-500/25 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  PRONTAS (RETIRAR)
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
                readyList.map(order => renderFooterCard(order, false))
              )}
            </div>
          </div>

          {/* COLUNA 3: RETIRADAS / ENTREGUES */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/60 p-2 flex flex-col shadow-inner min-h-0">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  RETIRADAS / ENTREGUES
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-950 px-2 py-0.2 rounded border border-slate-800">
                {deliveredList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {deliveredList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium">
                  Nenhum pedido entregue
                </div>
              ) : (
                deliveredList.map(order => renderFooterCard(order, true))
              )}
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================
          MODAL RÁPIDO: ADICIONAR NOVO ITEM NA CATEGORIA (+)
         ======================================================== */}
      {quickAddModal.isOpen && quickAddModal.category && (
        <div 
          onClick={() => setQuickAddModal({ isOpen: false, category: null })}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-emerald-500/60 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-100 font-sans cursor-default animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    Adicionar em {quickAddModal.category.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Novo sabor ou opção para venda rápida</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickAddModal({ isOpen: false, category: null })}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickAdd} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Item / Sabor:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pastel de Carne, Coca-Cola 350ml, etc."
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Preço (R$):
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAddPrice}
                    onChange={(e) => setQuickAddPrice(formatCurrencyMask(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-black outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prefixo da Comanda:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pas-, B-, Ref-"
                    value={quickAddPrefix}
                    onChange={(e) => setQuickAddPrefix(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição ou Ingredientes (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carne moída temperada com azeitonas"
                  value={quickAddDesc}
                  onChange={(e) => setQuickAddDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ isOpen: false, category: null })}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL RÁPIDO: EXCLUIR ITEM OU CATEGORIA (-)
         ======================================================== */}
      {quickDeleteModal.isOpen && quickDeleteModal.category && (
        <div 
          onClick={() => setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null })}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-rose-500/60 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-100 font-sans cursor-default animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/40">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    Gerenciar Exclusão em {quickDeleteModal.category.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Escolha o item a remover ou exclua a categoria</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null })}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickDeleteModal.itemToDelete ? (
              <div className="space-y-4">
                <div className="bg-rose-950/60 border border-rose-500/50 rounded-2xl p-4 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <div className="font-bold text-white text-sm">
                    Tem certeza que deseja excluir "{quickDeleteModal.itemToDelete.name}"?
                  </div>
                  <div className="text-xs text-rose-300">
                    Este item deixará de aparecer no cardápio do caixa imediatamente.
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQuickDeleteModal(prev => ({ ...prev, itemToDelete: null }))}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmQuickDelete(quickDeleteModal.itemToDelete)}
                    className="py-2 px-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
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
