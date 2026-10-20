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
  Check,
  Lock,
  Unlock,
  Pencil,
  LayoutGrid,
  Save,
  Banknote,
  CreditCard,
  QrCode,
  Upload,
  ImageIcon,
  Eraser,
  Palette,
  Flame,
  ChefHat
} from 'lucide-react';
import { storageService, formatPrice, getSectionBackgroundStyle, resolveSpacingPx, resolveHeightPx } from '../services/storage';
import { authService } from '../services/auth';
import ProfileSelector from './ProfileSelector';
import AnalogClock from './AnalogClock';
import AutoToast from './AutoToast';
import ProductIcon2D, { PRODUCT_2D_PRESETS } from './ProductIcon2D';
import { ITEM_COLOR_PALETTE } from './ConfigModal';
import { processProductImage } from '../utils/imageProcessor';

// Ícone Oficial do PIX (losangos entrelaçados estilizados do Banco Central)
const PixIcon = ({ className = "w-4 h-4", isSelected }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    className={className} 
    fill={isSelected ? "#34d399" : "#32bcad"}
  >
    <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" />
  </svg>
);

// Ícone do Cartão de Débito (Contactless por aproximação + chip)
const DebitCardIcon = ({ className = "w-4 h-4", isSelected }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect 
      x="2" y="4" width="20" height="16" rx="2.5" 
      fill="#022c22" 
      fillOpacity="0.9"
      stroke={isSelected ? "#34d399" : "#10b981"} 
      strokeWidth="1.6" 
    />
    {/* Chip dourado */}
    <rect 
      x="4.5" y="7" width="4.5" height="3.5" rx="0.8" 
      fill="#fbbf24" 
      stroke="#d97706"
      strokeWidth="0.5"
    />
    {/* Símbolo de aproximação / Contactless waves ))) */}
    <path 
      d="M15.5 7.5a2.5 2.5 0 0 1 0 3.5M17.5 6.2a4.5 4.5 0 0 1 0 6.1" 
      stroke={isSelected ? "#6ee7b7" : "#34d399"} 
      strokeWidth="1.3" 
      strokeLinecap="round" 
    />
    {/* Linhas do cartão */}
    <line x1="4.5" y1="13.5" x2="11.5" y2="13.5" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1" />
    {/* Círculos de bandeira no rodapé */}
    <circle cx="16" cy="15.5" r="2" fill="#ef4444" fillOpacity="0.85" />
    <circle cx="18" cy="15.5" r="2" fill="#f59e0b" fillOpacity="0.85" />
  </svg>
);

// Ícone do Cartão de Crédito (com tarja magnética superior preta + chip)
const CreditCardIcon = ({ className = "w-4 h-4", isSelected }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect 
      x="2" y="4" width="20" height="16" rx="2.5" 
      fill="#0f172a" 
      fillOpacity="0.9"
      stroke={isSelected ? "#60a5fa" : "#3b82f6"} 
      strokeWidth="1.6" 
    />
    {/* Tarja magnética superior escura */}
    <rect 
      x="2" y="7.5" width="20" height="3.2" 
      fill="#020617" 
      fillOpacity="1"
    />
    {/* Chip dourado */}
    <rect 
      x="4.5" y="13" width="4.5" height="3.5" rx="0.8" 
      fill="#fbbf24" 
      stroke="#d97706"
      strokeWidth="0.5"
    />
    {/* Linhas de numeração do cartão */}
    <line x1="11.5" y1="14" x2="18.5" y2="14" stroke={isSelected ? "#bfdbfe" : "#93c5fd"} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="11.5" y1="16" x2="15.5" y2="16" stroke={isSelected ? "#93c5fd" : "#60a5fa"} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Ícone de Dinheiro (cédulas verdes de papel com $ central)
const CashIcon = ({ className = "w-4 h-4", isSelected }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Cédula traseira inclinada/deslocada */}
    <rect 
      x="2" y="3.5" width="16" height="10" rx="2" 
      stroke="#059669" 
      strokeWidth="1.2"
      fill="#065f46" 
      fillOpacity="0.6" 
    />
    {/* Cédula frontal */}
    <rect 
      x="5" y="7" width="17" height="12.5" rx="2" 
      stroke={isSelected ? "#34d399" : "#10b981"} 
      strokeWidth="1.5"
      fill="#047857" 
      fillOpacity="0.95" 
    />
    {/* Círculo central */}
    <circle 
      cx="13.5" cy="13.2" r="3" 
      stroke="#6ee7b7" 
      strokeWidth="1.2"
      fill="#064e3b"
      fillOpacity="0.9"
    />
    {/* Cifrão central */}
    <path 
      d="M13.5 11.4v3.6M12.4 12.2c0-.6.5-1 1.1-1s1.1.3 1.1.9c0 .7-1.1.7-1.1 1.2 0 .5.5.8 1.1.8s1.1-.4 1.1-.9" 
      stroke="#ecfdf5" 
      strokeWidth="1.1" 
    />
    {/* Pontinhos nas bordas */}
    <circle cx="7.5" cy="13.2" r="0.75" fill="#a7f3d0" />
    <circle cx="19.5" cy="13.2" r="0.75" fill="#a7f3d0" />
  </svg>
);

export default function CashierView({ environment, onOpenConfig, onNavigate }) {
  // Estado do Caixa
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);
  const [currentEvent, setCurrentEvent] = useState(() => storageService.getCurrentEvent());
  const [showCurrencySymbol, setShowCurrencySymbol] = useState(storageService.getShowCurrencySymbol());

  // Ambientes de Trabalho (Cozinhas, Caixas, TVs)
  const [environments, setEnvironments] = useState(() => authService.getEnvironments());

  // Cozinha de destino dos pedidos deste terminal (persistido no localStorage deste navegador)
  const [destinationKitchen, setDestinationKitchen] = useState(() => {
    return localStorage.getItem('cantina_cashier_destination_kitchen') || 'auto';
  });

  // Identificação deste terminal de Caixa (ex: Caixa 1, Caixa 2, etc.)
  const [cashierTerminal, setCashierTerminal] = useState(() => {
    return localStorage.getItem('cantina_cashier_terminal') || 'Caixa 1';
  });

  // Trava de telas dos monitores e tablets (Cozinha e Telão)
  const [screensLocked, setScreensLocked] = useState(() => storageService.isScreensLocked());
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('pt-BR', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Configuração do Fundo da Seção dos Cards
  const [bgSettings, setBgSettings] = useState(() => storageService.getBackgroundSettings());

  // Configurações Gerais do Sistema (Espaçamento de cards, efeitos, sons)
  const [systemSettings, setSystemSettings] = useState(() => storageService.getSystemSettings());

  const kitchenEnvironments = environments.filter(e => e.type === 'kitchen');

  useEffect(() => {
    const handleCurrencyChanged = (e) => {
      setShowCurrencySymbol(Boolean(e.detail));
    };
    const handleEnvsChange = (e) => {
      setEnvironments(e.detail || authService.getEnvironments());
    };
    const handleScreensLockChange = (e) => {
      setScreensLocked(!!e.detail);
    };
    const handleBgChange = (e) => {
      setBgSettings(e.detail || storageService.getBackgroundSettings());
    };
    const handleSystemChange = (e) => {
      setSystemSettings(e.detail || storageService.getSystemSettings());
    };
    window.addEventListener('cantina_currency_changed', handleCurrencyChanged);
    window.addEventListener('cantina_environments_changed', handleEnvsChange);
    window.addEventListener('cantina_screens_locked_changed', handleScreensLockChange);
    window.addEventListener('cantina_background_settings_changed', handleBgChange);
    window.addEventListener('cantina_system_settings_changed', handleSystemChange);
    return () => {
      window.removeEventListener('cantina_currency_changed', handleCurrencyChanged);
      window.removeEventListener('cantina_environments_changed', handleEnvsChange);
      window.removeEventListener('cantina_screens_locked_changed', handleScreensLockChange);
      window.removeEventListener('cantina_background_settings_changed', handleBgChange);
      window.removeEventListener('cantina_system_settings_changed', handleSystemChange);
    };
  }, []);

  const handleToggleScreensLock = async () => {
    const nextState = !screensLocked;
    await storageService.setScreensLocked(nextState);
  };

  const handleDestinationKitchenChange = (newDest) => {
    setDestinationKitchen(newDest);
    localStorage.setItem('cantina_cashier_destination_kitchen', newDest);
    storageService.setCashierTerminalDestination(cashierTerminal, newDest);
  };

  const handleTerminalChange = (newTerm) => {
    setCashierTerminal(newTerm);
    localStorage.setItem('cantina_cashier_terminal', newTerm);
    storageService.setCashierTerminalDestination(newTerm, destinationKitchen);
  };

  // ========================================================
  // NOVO FLUXO DE ATENDIMENTO AO CLIENTE (MULTI-PEDIDOS)
  // 1º Passo: Digita o Nome do Cliente e escolhe a forma de pagamento
  // 2º Passo: Clica nos produtos (Pastel, Batata, Pizza...) e vai montando a comanda
  // ========================================================
  const [customerName, setCustomerName] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  
  // Itens da comanda do cliente:
  // Array de { cartItemId, category, item, variation, description, prefix, unitPrice, quantity }
  const [cart, setCart] = useState([]);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);

  // Sabor de pizza ativo para escolha de Pedaço ou Inteira
  const [selectedPizzaFlavor, setSelectedPizzaFlavor] = useState(null);
  const [activeOptionCardId, setActiveOptionCardId] = useState(null);
  const [closingOptionCardId, setClosingOptionCardId] = useState(null);
  const closeOptionTimerRef = useRef(null);
  const [clickedCardId, setClickedCardId] = useState(null);
  const clickFeedbackTimerRef = useRef(null);

  const triggerCardClickFeedback = (cardKey) => {
    setClickedCardId(null);
    requestAnimationFrame(() => {
      setClickedCardId(cardKey);
    });
    if (clickFeedbackTimerRef.current) clearTimeout(clickFeedbackTimerRef.current);
    clickFeedbackTimerRef.current = setTimeout(() => {
      setClickedCardId(null);
    }, 2250);
  };

  const handleOptionCardMouseEnter = (cardKey) => {
    if (closingOptionCardId === cardKey) {
      if (closeOptionTimerRef.current) {
        clearTimeout(closeOptionTimerRef.current);
        closeOptionTimerRef.current = null;
      }
      setClosingOptionCardId(null);
      setActiveOptionCardId(cardKey);
    }
  };

  const handleOptionCardMouseLeave = (cardKey) => {
    if (activeOptionCardId === cardKey) {
      setClosingOptionCardId(cardKey);
      if (closeOptionTimerRef.current) clearTimeout(closeOptionTimerRef.current);
      closeOptionTimerRef.current = setTimeout(() => {
        setActiveOptionCardId((curr) => (curr === cardKey ? null : curr));
        setClosingOptionCardId((curr) => (curr === cardKey ? null : curr));
      }, 2250);
    }
  };

  const handleCloseOptionModal = () => {
    if (closeOptionTimerRef.current) {
      clearTimeout(closeOptionTimerRef.current);
      closeOptionTimerRef.current = null;
    }
    setClosingOptionCardId(null);
    setActiveOptionCardId(null);
  };

  const closeFlavorTimerRef = useRef(null);

  const handleFlavorMouseEnter = () => {
    if (closeFlavorTimerRef.current) {
      clearTimeout(closeFlavorTimerRef.current);
      closeFlavorTimerRef.current = null;
    }
  };

  const handleFlavorMouseLeave = () => {
    if (closeFlavorTimerRef.current) clearTimeout(closeFlavorTimerRef.current);
    closeFlavorTimerRef.current = setTimeout(() => {
      setSelectedPizzaFlavor(null);
    }, 280);
  };

  // Validação e feedback
  const [nameShake, setNameShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [toast, setToast] = useState(null);

  // Estado para o hint bonito dos pedidos ao passar o mouse no card do rodapé
  const [hoveredOrderHint, setHoveredOrderHint] = useState(null);
  const [hintCoords, setHintCoords] = useState({ x: 0, y: 0, placeAbove: true });

  const handleCardMouseEnter = (e, order) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const placeAbove = rect.top > 160;
    setHintCoords({
      x: Math.min(Math.max(rect.left, 12), window.innerWidth - 330),
      y: placeAbove ? rect.top : rect.bottom,
      placeAbove
    });
    setHoveredOrderHint(order);
  };

  const handleCardMouseLeave = () => {
    setHoveredOrderHint(null);
  };

  // Modais rápidos na linha da categoria: + (verde) e - (vermelho)
  const [quickAddModal, setQuickAddModal] = useState({ isOpen: false, category: null });
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('0,00');
  const [quickAddPrefix, setQuickAddPrefix] = useState('');
  const [quickAddDesc, setQuickAddDesc] = useState('');

  const [quickDeleteModal, setQuickDeleteModal] = useState({ isOpen: false, category: null, itemToDelete: null });
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [quickEditModal, setQuickEditModal] = useState({
    isOpen: false,
    item: null,
    category: null,
    name: '',
    price: '0,00',
    pedacoPrice: '0,00',
    inteiraPrice: '0,00',
    color: '#eab308',
    image: null,
    icon2d: null,
    destination: 'COZINHA'
  });
  const [quickEditApplyToCategory, setQuickEditApplyToCategory] = useState(true);
  const [quickEditShowPresets, setQuickEditShowPresets] = useState(false);
  const [quickEditAutoRemoveBg, setQuickEditAutoRemoveBg] = useState(true);
  const [quickEditIsProcessingImg, setQuickEditIsProcessingImg] = useState(false);

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
        if (quickEditModal.isOpen) {
          setQuickEditModal({ isOpen: false, item: null, category: null, name: '', price: '0,00', pedacoPrice: '0,00', inteiraPrice: '0,00' });
          return;
        }
        if (quickDeleteModal.isOpen) {
          setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null });
          return;
        }
        if (quickAddModal.isOpen) {
          setQuickAddModal({ isOpen: false, category: null });
          return;
        }
        if (activeOptionCardId || closingOptionCardId) {
          handleCloseOptionModal();
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
  }, [quickEditModal.isOpen, quickDeleteModal.isOpen, quickAddModal.isOpen, activeOptionCardId, closingOptionCardId, selectedPizzaFlavor, cart.length]);

  // Estilo do fundo da seção de produtos (Caixa)
  const bgStyle = getSectionBackgroundStyle(bgSettings);

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

  const isValidColorHex = (c) => {
    if (!c || typeof c !== 'string') return false;
    const s = c.trim().toLowerCase();
    return s.startsWith('#') || s.startsWith('rgb');
  };

  // Cores de fundo e borda para cada categoria de item (identados no rodapé)
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

  // Cores de fundo e texto para os chips do carrinho de compras
  const getCartItemStyle = (cItem) => {
    const customColor = (isValidColorHex(cItem.color) && cItem.color) ||
      (isValidColorHex(cItem.item?.color) && cItem.item?.color) ||
      (isValidColorHex(cItem.category?.color) && cItem.category?.color);

    if (customColor) {
      return {
        chip: '',
        style: {
          backgroundColor: `${customColor}22`,
          borderColor: `${customColor}80`,
          color: '#ffffff'
        },
        priceStyle: {
          color: customColor
        }
      };
    }

    const cat = String(cItem.category?.id || cItem.categoryId || '').toLowerCase();
    const desc = String(cItem.description || '').toLowerCase();

    if (cat.includes('batata') || desc.includes('batata') || desc.includes('cone') || desc.includes('cheddar')) {
      return {
        chip: 'bg-orange-950/80 border-orange-500/60 text-orange-200',
        price: 'text-orange-300'
      };
    }
    if (cat.includes('acai') || cat.includes('açaí') || desc.includes('açaí') || desc.includes('acai')) {
      return {
        chip: 'bg-purple-950/80 border-purple-500/60 text-purple-200',
        price: 'text-purple-300'
      };
    }
    if (cat.includes('pizza') || desc.includes('pizza') || desc.includes('pedaço') || desc.includes('inteira') || desc.includes('marguerita') || desc.includes('calabresa')) {
      return {
        chip: 'bg-yellow-950/80 border-yellow-500/60 text-yellow-200',
        price: 'text-yellow-300'
      };
    }
    return {
      chip: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200',
      price: 'text-cyan-300'
    };
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

  // Resolução inteligente da cor do item para os mini cards e pedidos
  const getOrderItemColor = (order) => {
    if (isValidColorHex(order.color)) return order.color;
    const items = order.items && order.items.length > 0 ? order.items : getOrderItems(order);
    const firstItem = items?.[0];
    if (isValidColorHex(firstItem?.color)) return firstItem.color;

    const numClean = (order.orderNumber || '').toUpperCase();
    const itemId = firstItem?.itemId || order.itemId;
    const variationId = firstItem?.variationId || order.variationId;
    const itemName = firstItem?.itemName || order.itemName;

    if (categories && categories.length > 0) {
      if (variationId) {
        for (const cat of categories) {
          const v = (cat.variations || []).find(x => x.id === variationId);
          if (isValidColorHex(v?.color)) return v.color;
        }
      }
      if (itemId) {
        for (const cat of categories) {
          const it = (cat.items || []).find(x => x.id === itemId);
          if (isValidColorHex(it?.color)) return it.color;
        }
      }
      if (itemName) {
        for (const cat of categories) {
          const it = (cat.items || []).find(x => x.name?.toLowerCase() === itemName?.toLowerCase());
          if (isValidColorHex(it?.color)) return it.color;
        }
      }
      // Busca ampla por descrição ou nome nos itens cadastrados
      const searchDesc = (itemName || firstItem?.description || order.fullDescription || '').toLowerCase();
      if (searchDesc) {
        for (const cat of categories) {
          const it = (cat.items || []).find(x => x.name && (searchDesc.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(searchDesc)));
          if (isValidColorHex(it?.color)) return it.color;
          if (cat.name && searchDesc.includes(cat.name.toLowerCase()) && isValidColorHex(cat.color)) {
            return cat.color;
          }
        }
      }
      for (const cat of categories) {
        const v = (cat.variations || []).find(x => x.prefix && numClean.startsWith(x.prefix.toUpperCase()));
        if (isValidColorHex(v?.color)) return v.color;
        const it = (cat.items || []).find(x => x.prefix && numClean.startsWith(x.prefix.toUpperCase()));
        if (isValidColorHex(it?.color)) return it.color;
        if (cat.prefixDefault && numClean.startsWith(cat.prefixDefault.toUpperCase()) && isValidColorHex(cat.color)) {
          return cat.color;
        }
      }
    }

    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (cat.includes('pizza') || numClean.startsWith('P') || numClean.startsWith('PP') || numClean.startsWith('PI')) {
      return '#eab308';
    }
    if (cat.includes('acai') || cat.includes('açaí') || numClean.startsWith('A')) {
      return '#a855f7';
    }
    if (cat.includes('batata') || cat.includes('frita') || numClean.startsWith('B')) {
      return '#f97316';
    }
    return '#06b6d4';
  };

  // Cores distintas para Pizza, Açaí e Batata nos Cards do Rodapé
  const getOrderCategoryStyle = (order) => {
    const itemColor = getOrderItemColor(order);
    const cat = (order.category || order.categoryName || '').toLowerCase();
    if (cat.includes('pizza') || cat.includes('ped') || cat.includes('int')) {
      return {
        icon: <Pizza className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
        border: 'border-yellow-500/50 hover:border-yellow-400',
        bg: 'bg-yellow-950/40 hover:bg-yellow-950/60',
        badgeColor: 'text-yellow-300 bg-yellow-950/90 border-yellow-500/50',
        textColor: 'text-yellow-200',
        color: itemColor
      };
    }
    if (cat.includes('acai') || cat.includes('açaí')) {
      return {
        icon: <IceCream className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
        border: 'border-purple-500/50 hover:border-purple-400',
        bg: 'bg-purple-950/40 hover:bg-purple-950/60',
        badgeColor: 'text-purple-300 bg-purple-950/90 border-purple-500/50',
        textColor: 'text-purple-200',
        color: itemColor
      };
    }
    if (cat.includes('batata') || cat.includes('frita')) {
      return {
        icon: <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
        border: 'border-orange-500/50 hover:border-orange-400',
        bg: 'bg-orange-950/40 hover:bg-orange-950/60',
        badgeColor: 'text-orange-300 bg-orange-950/90 border-orange-500/50',
        textColor: 'text-orange-200',
        color: itemColor
      };
    }
    return {
      icon: <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      border: 'border-slate-700 hover:border-slate-500',
      bg: 'bg-slate-900/60 hover:bg-slate-850',
      badgeColor: 'text-slate-300 bg-slate-800 border-slate-600',
      textColor: 'text-slate-200',
      color: itemColor
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

  // Identifica se um item ou categoria possui múltiplas opções (ex: Fatia e Inteira na Pizza, ou variações)
  const getItemOptions = (category, item) => {
    if (!category || !item) return null;
    if (item.variations && Array.isArray(item.variations) && item.variations.length > 1) {
      return item.variations;
    }
    if (category.variations && Array.isArray(category.variations) && category.variations.length > 1) {
      return category.variations;
    }
    return null;
  };

  // Adicionar opção/variação (ex: Fatia ou Inteira) à comanda
  const handleAddOptionToCart = (category, item, variation) => {
    const isPizza = category.id === 'pizza';
    const isPedaco = variation.id === 'pedaco';
    const prefix = variation.prefix || (isPizza ? (isPedaco ? 'Pp-' : 'Pi-') : (category.prefixDefault || 'Ped-'));
    const unitPrice = variation.price !== undefined ? variation.price : (item.price || 0);
    const description = `${variation.name.toUpperCase()}: ${item.name}`;
    const cartItemId = `${category.id}_${item.id}_${variation.id}`;
    const color = (isValidColorHex(variation.color) ? variation.color : null) ||
      (isValidColorHex(item.color) ? item.color : null) ||
      (isValidColorHex(category.color) ? category.color : null) ||
      getCategoryColor(category);

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
        variation,
        description,
        prefix,
        unitPrice,
        quantity: 1,
        color
      }];
    });

    if (!customerName.trim()) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
    triggerCardClickFeedback(`${category.id}_${item.id}`);
  };

  // Clique no card ou botão: se tiver mais de uma opção, as opções aparecem forçando a escolha
  // Se tiver só uma opção, faz o efeito de clique com bordas brilhantes que somem aos poucos
  const handleCardClick = (category, item) => {
    const cardKey = `${category.id}_${item.id}`;
    const options = getItemOptions(category, item);
    if (options && options.length > 1) {
      if (closeOptionTimerRef.current) {
        clearTimeout(closeOptionTimerRef.current);
        closeOptionTimerRef.current = null;
      }
      setClosingOptionCardId(null);
      setActiveOptionCardId(prev => prev === cardKey ? null : cardKey);
    } else {
      handleCloseOptionModal();
      triggerCardClickFeedback(cardKey);
      handleAddItemToCart(category, item);
    }
  };

  // Adicionar pizza com variação (compatibilidade legada)
  const handleAddPizzaToCart = (flavor, variation) => {
    const pizzaCat = categories.find(c => c.id === 'pizza');
    handleAddOptionToCart(pizzaCat || { id: 'pizza', name: 'PIZZA' }, flavor, variation);
  };

  // Adicionar item direto (Batata, Açaí, Salgados, Bebidas, etc.) à comanda
  const handleAddItemToCart = (category, item) => {
    const cartItemId = `${category.id}_${item.id}`;
    const prefix = item.prefix || category.prefixDefault || 'Ped-';
    const unitPrice = item.price || 0;
    const description = item.name;
    const color = (isValidColorHex(item.color) ? item.color : null) || 
      (isValidColorHex(category.color) ? category.color : null) || (
        category.id === 'acai' ? '#a855f7' : category.id === 'batata' ? '#f97316' : '#06b6d4'
      );

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
        quantity: 1,
        color
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
    const matches = cart.filter(i => i?.item?.id === itemId);
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
        let targetEnvironment = 'COZINHA';

        // Roteamento inteligente: prioridade para item específico (ex: Margueritta) -> variação (ex: Inteira) -> categoria
        let itemExplicitEnv = null;
        let itemExplicitSend = null;

        if (item?.id && routing.destinationEnv?.[item.id] !== undefined) {
          itemExplicitEnv = routing.destinationEnv[item.id];
          itemExplicitSend = routing.sendToKitchen?.[item.id] !== false;
        } else if (targetId && routing.destinationEnv?.[targetId] !== undefined) {
          itemExplicitEnv = routing.destinationEnv[targetId];
          itemExplicitSend = routing.sendToKitchen?.[targetId] !== false;
        } else if (routing.destinationEnv?.[catId] !== undefined) {
          itemExplicitEnv = routing.destinationEnv[catId];
          itemExplicitSend = routing.sendToKitchen?.[catId] !== false;
        }

        if (itemExplicitEnv !== null) {
          targetEnvironment = itemExplicitEnv;
          sendToKitchen = itemExplicitEnv !== 'none' && itemExplicitSend !== false;
        } else {
          // Padrão do sistema: Pizza vai para 'COZINHA', outros direto no balcão
          sendToKitchen = (catId === 'pizza');
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
          targetEnvironment,
          color: cartItem.color
        };
      });

      const kitchenItems = orderItems.filter(it => it.sendToKitchen && it.targetEnvironment && it.targetEnvironment !== 'none');
      const primaryTargetEnv = kitchenItems.length > 0 ? kitchenItems[0].targetEnvironment : 'none';

      const destKitchenObj = environments.find(e => e.id === primaryTargetEnv);

      const newOrder = {
        orderNumber: primaryOrderNumber, // SENHA ÚNICA
        customerName: cleanName,
        paymentMethod,
        items: orderItems,
        category: cart[0].category.id,
        categoryName: cart[0].category.name,
        itemId: cart[0].item.id,
        itemName: cart[0].item.name,
        color: cart[0].color,
        fullDescription: orderItems.map(it => `${String(it.quantity).padStart(2, '0')} ${it.description}`).join(' | '),
        quantity: cartItemCount,
        unitPrice: cart[0].unitPrice,
        totalPrice: cartTotal,
        paymentMethod,
        sendToKitchen: orderItems.some(it => it.sendToKitchen),
        targetEnvironment: primaryTargetEnv,
        targetKitchenName: destKitchenObj?.name || primaryTargetEnv,
        cashierTerminal: cashierTerminal || 'Caixa 1',
        showOnTV: true,
        status: 'em_preparo'
      };

      const created = await storageService.createOrder(newOrder);

      // NOVO RENDER CÍRCULO / BOLA PULSANTE E GIRANDO (EXCLUSIVAMENTE PARA PEDIDOS)
      setToast({
        type: 'success',
        title: 'PEDIDO ENVIADO!',
        orderNumber: created.orderNumber,
        customerName: cleanName.toUpperCase(),
        destination: destKitchenObj?.name || primaryTargetEnv,
        terminal: cashierTerminal,
        total: formatPrice(cartTotal, showCurrencySymbol)
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
        title: 'ERRO AO ENVIAR',
        message: err.message || 'Falha ao registrar venda'
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
  };

  const handleDeleteCategory = (cat) => {
    if (!cat) return;
    if (['pizza', 'acai', 'batata'].includes(cat.id)) {
      return;
    }

    const updatedCategories = categories.filter((c) => c.id !== cat.id);
    storageService.saveProducts(updatedCategories);
    setCategories(updatedCategories);

    setQuickDeleteModal({ isOpen: false, category: null, itemToDelete: null });
  };

  const pizzaCategory = categories.find(c => c.id === 'pizza');
  const acaiCategory = categories.find(c => c.id === 'acai');
  const batataCategory = categories.find(c => c.id === 'batata');
  const otherCategories = categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id));

  const isNameFilled = customerName.trim().length > 0;

  const handleOpenQuickEdit = (category, item) => {
    if (!category || !item) return;
    const isPizza = category.id === 'pizza';
    const pedacoVar = category.variations?.find(v => v.id === 'pedaco') || { price: 9 };
    const inteiraVar = category.variations?.find(v => v.id === 'inteira') || { price: 48 };

    const routing = storageService.getProductionRouting();
    let currentDest = routing.destinationEnv?.[item.id] || routing.destinationEnv?.[category.id];
    if (!currentDest) {
      currentDest = isPizza ? 'COZINHA' : 'none';
    }

    setQuickEditShowPresets(false);
    setQuickEditApplyToCategory(true);
    setQuickEditModal({
      isOpen: true,
      item,
      category,
      name: item.name || '',
      price: formatCurrencyMask(item.price || 0),
      pedacoPrice: formatCurrencyMask(pedacoVar.price || 0),
      inteiraPrice: formatCurrencyMask(inteiraVar.price || 0),
      color: item.color || getCategoryColor(category),
      image: item.image || null,
      icon2d: item.icon2d || null,
      destination: currentDest
    });
  };

  const handleQuickEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setQuickEditIsProcessingImg(true);
      const result = await processProductImage(file, {
        removeBackground: quickEditAutoRemoveBg,
        maxSize: 180,
        quality: 0.82
      });
      const dataUrl = typeof result === 'string' ? result : (result?.dataUrl || '');
      setQuickEditModal(prev => ({
        ...prev,
        image: dataUrl,
        icon2d: null
      }));
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    } finally {
      setQuickEditIsProcessingImg(false);
      e.target.value = '';
    }
  };

  const handleQuickEditSelectPreset = (presetId) => {
    setQuickEditModal(prev => ({
      ...prev,
      icon2d: presetId,
      image: null
    }));
    setQuickEditShowPresets(false);
  };

  const handleQuickEditClearCustomArt = () => {
    setQuickEditModal(prev => ({
      ...prev,
      image: null,
      icon2d: null
    }));
  };

  const handleSaveQuickEdit = (e) => {
    e.preventDefault();
    const { category, item, name, price, pedacoPrice, inteiraPrice, color, image, icon2d, destination } = quickEditModal;
    if (!category || !item) return;

    const isPizza = category.id === 'pizza';
    const cleanName = name.trim() || item.name;

    const updatedCategories = categories.map((c) => {
      if (c.id === category.id) {
        if (isPizza) {
          const updatedVariations = (c.variations || []).map(v => {
            if (v.id === 'pedaco') return { ...v, price: parseCurrencyMask(pedacoPrice) };
            if (v.id === 'inteira') return { ...v, price: parseCurrencyMask(inteiraPrice) };
            return v;
          });
          const updatedItems = (c.items || []).map(it => {
            if (it.id === item.id) {
              return { 
                ...it, 
                name: cleanName,
                color: color || it.color,
                image: image || null,
                icon2d: icon2d || null
              };
            }
            return it;
          });
          return { ...c, variations: updatedVariations, items: updatedItems };
        } else {
          const numericPrice = parseCurrencyMask(price);
          const updatedItems = (c.items || []).map(it => {
            if (it.id === item.id) {
              return { 
                ...it, 
                name: cleanName, 
                price: numericPrice,
                color: color || it.color,
                image: image || null,
                icon2d: icon2d || null
              };
            }
            return it;
          });
          return { ...c, items: updatedItems };
        }
      }
      return c;
    });

    storageService.saveProducts(updatedCategories);
    setCategories(updatedCategories);

    // Salva o roteamento de preparo para o item e/ou categoria
    const targetEnv = destination || (isPizza ? 'COZINHA' : 'none');
    const isKitchen = targetEnv !== 'none';
    const currentRouting = storageService.getProductionRouting();
    const updatedRouting = {
      ...currentRouting,
      sendToKitchen: {
        ...(currentRouting.sendToKitchen || {}),
        [item.id]: isKitchen,
        ...(quickEditApplyToCategory || isPizza ? {
          [category.id]: isKitchen,
          ...(isPizza ? { 'pizza': isKitchen, 'pedaco': isKitchen, 'inteira': isKitchen } : {})
        } : {})
      },
      destinationEnv: {
        ...(currentRouting.destinationEnv || {}),
        [item.id]: targetEnv,
        ...(quickEditApplyToCategory || isPizza ? {
          [category.id]: targetEnv,
          ...(isPizza ? { 'pizza': targetEnv, 'pedaco': targetEnv, 'inteira': targetEnv } : {})
        } : {})
      }
    };
    storageService.saveProductionRouting(updatedRouting);

    setQuickEditModal({ 
      isOpen: false, 
      item: null, 
      category: null, 
      name: '', 
      price: '0,00', 
      pedacoPrice: '0,00', 
      inteiraPrice: '0,00', 
      color: '#eab308',
      image: null,
      icon2d: null,
      destination: 'COZINHA'
    });
    setToast({
      type: 'success',
      title: 'ITEM ATUALIZADO!',
      orderNumber: 'OK',
      customerName: cleanName.toUpperCase(),
      destination: targetEnv === 'none' ? 'Balcão (Sem Preparo)' : (environments.find(e => e.id === targetEnv)?.name || targetEnv),
      terminal: cashierTerminal,
      total: isPizza ? `Fatia: R$ ${pedacoPrice} | Inteira: R$ ${inteiraPrice}` : `R$ ${price}`
    });
  };

  const getCategoryColor = (cat) => {
    if (!cat) return '#eab308';
    if (cat.color && isValidColorHex(cat.color)) return cat.color;
    if (cat.id === 'pizza') return '#eab308';
    if (cat.id === 'acai') return '#a855f7';
    if (cat.id === 'batata') return '#f97316';
    return '#06b6d4';
  };


  // Renderizador de card do rodapé com SENHA ÚNICA e itens consolidados no mesmo card
  const renderFooterCard = (order, isDelivered = false) => {
    const rawColor = getOrderItemColor(order);
    const isWhite = !rawColor || ['#fff', '#ffffff', 'white', '#f8fafc', '#f1f5f9'].includes(rawColor.trim().toLowerCase());
    const itemColor = isWhite ? '#64748b' : rawColor;

    const items = order.items && order.items.length > 0 ? order.items : getOrderItems(order);

    // Linha superior e inferior: cinza suave discreto (30% de intensidade)
    const topBottomBorderColor = 'rgba(100, 116, 139, 0.3)';
    // Borda esquerda: cor do item ou cinza atenuado se for branco
    const leftBorderColor = isWhite ? 'rgba(148, 163, 184, 0.45)' : itemColor;

    const cashCardH = resolveHeightPx(systemSettings?.cashierCardHeight, 42);
    const cashCardPadY = cashCardH <= 34 ? 'py-0.5' : 'py-1';

    return (
      <div 
        key={order.id || order.orderIds?.[0] || order.orderNumber}
        style={{
          borderLeftColor: leftBorderColor,
          borderTopColor: topBottomBorderColor,
          borderBottomColor: topBottomBorderColor,
          minHeight: `${cashCardH}px`
        }}
        className={`px-2 ${cashCardPadY} rounded-l-lg rounded-r-none border-y border-l-[4px] border-r-0 transition-all shadow-md text-xs flex items-center justify-between gap-1.5 relative bg-slate-900/90 hover:bg-slate-850 ${
          isDelivered ? 'opacity-70 hover:opacity-100' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {/* NÚMERO / SENHA DO PEDIDO (COLUNA COM TAMANHO FIXO DE 8 CARACTERES) */}
          <span 
            className="font-mono font-black text-xs px-1 py-0.2 rounded-md shrink-0 inline-flex items-center justify-center w-[8ch] box-content text-center select-none"
            style={{
              backgroundColor: `${itemColor}20`,
              color: isWhite ? '#94a3b8' : itemColor
            }}
          >
            {order.orderNumber}
          </span>

          <span className="text-slate-600 font-bold select-none text-[10px] shrink-0">|</span>

          {/* NOME DO CLIENTE: 10% menor, sempre BOLD */}
          <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wider truncate max-w-[120px]" title={order.customerName}>
            {order.customerName}
          </span>

          {/* CAPTION/BOTÃO PEDIDOS: FONTE REDUZIDA EM 20% */}
          <div 
            onMouseEnter={(e) => handleCardMouseEnter(e, order)}
            onMouseLeave={handleCardMouseLeave}
            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-black text-white border border-slate-700 shadow-xs shrink-0 select-none hover:border-amber-400 cursor-pointer transition-all"
          >
            <span>PEDIDOS</span>
            <span className="bg-slate-800 text-amber-400 px-1 py-0.2 rounded font-mono text-[8px]">
              {items.reduce((acc, it) => acc + (it.quantity || 1), 0)}
            </span>
          </div>
        </div>

        {/* VALOR TOTAL */}
        <span className="text-[11px] font-mono font-black text-emerald-400 shrink-0">
          {formatPrice(order.totalPrice, showCurrencySymbol)}
        </span>
      </div>
    );
  };

  const displayedItems = [];
  const activeCategories = selectedTypeFilter === 'all'
    ? categories
    : categories.filter(c => c.id === selectedTypeFilter);

  activeCategories.forEach((cat) => {
    (cat.items || []).forEach((it) => {
      displayedItems.push({ item: it, category: cat });
    });
  });

  const totalItemsCount = categories.reduce((acc, c) => acc + (c.items?.length || 0), 0);

  const cashierSpacingClass = {
    compact: 'space-y-0.5',
    normal: 'space-y-1.5',
    relaxed: 'space-y-2.5',
    spacious: 'space-y-4'
  }[systemSettings?.cashierCardSpacing || 'normal'] || 'space-y-1.5';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden text-xs">
      
      {/* BARRA SUPERIOR DO CAIXA (ALTURA AUMENTADA EM 15%) */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-3 py-2.5 min-h-[52px] flex items-center justify-between shrink-0 shadow-sm gap-2">
        {/* LADO ESQUERDO: TERMINAL + ADMIN (MENOR) + ENVIA PEDIDOS PARA + COZINHA DESTINO */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gradient-to-tr from-amber-500 to-red-600 p-2 rounded-lg shadow shrink-0">
            <Pizza className="w-4 h-4 text-white" />
          </div>

          {/* 1. SELETOR DO TERMINAL: CAIXA XX (FONTE +30%) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/90 rounded-xl px-3 py-1 shadow-xs shrink-0">
            <select
              value={cashierTerminal}
              onChange={(e) => handleTerminalChange(e.target.value)}
              className="bg-transparent text-emerald-400 font-black text-sm sm:text-base outline-none cursor-pointer font-mono"
              title="Identificação deste terminal de caixa"
            >
              <option value="Caixa 1" className="bg-slate-900 text-emerald-300">Caixa 1</option>
              <option value="Caixa 2" className="bg-slate-900 text-emerald-300">Caixa 2</option>
              <option value="Caixa 3" className="bg-slate-900 text-emerald-300">Caixa 3</option>
              <option value="Caixa 4" className="bg-slate-900 text-emerald-300">Caixa 4</option>
              <option value="Caixa 5" className="bg-slate-900 text-emerald-300">Caixa 5</option>
            </select>
          </div>

          {/* 2. ADMIN (MENOR) */}
          <ProfileSelector 
            compact={true}
            align="left"
            onProfileChange={(profileId) => {
              if (onNavigate) onNavigate(profileId);
            }}
            onOpenConfig={onOpenConfig}
          />
        </div>

        {/* HORA LOCAL NO CENTRO: RELÓGIO ANALÓGICO À ESQ + HORA DIGITAL (+50%) */}
        <div className="flex-1 flex justify-center items-center px-2">
          <div className="flex items-center gap-2.5 select-none">
            {/* RELÓGIO ANALÓGICO COM FUNDO BRANCO E SEGUNDO VERMELHO (CÍRCULO PERFEITO) */}
            <div className="w-8 h-8 shrink-0 aspect-square flex items-center justify-center drop-shadow-md hover:scale-105 transition-transform" title="Relógio analógico em tempo real">
              <AnalogClock size={32} />
            </div>

            {/* CAIXA HORA DIGITAL (FUNDO PRETO, FONTE BRANCA AUMENTADA EM 50%) */}
            <div className="bg-black text-white px-3.5 py-1 rounded-xl font-mono font-black text-base sm:text-lg tracking-widest border border-slate-800 shadow-inner flex items-center">
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* CONTROLES SUPERIORES À DIREITA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center px-1" title={isFirebaseOnline ? 'Conexão Nuvem Online' : 'Modo Local'}>
            <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          </div>

          {/* BOTÃO REMOTO DE TRAVA DE MONITORES E TABLETS (SEMPRE EXIBIDO) */}
          <button
            onClick={handleToggleScreensLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 border cursor-pointer shrink-0 ${
              screensLocked
                ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500/80 text-rose-300 ring-1 ring-rose-500/40 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/90 text-slate-300'
            }`}
            title={
              screensLocked
                ? 'Monitores e tablets (Cozinha e Telão) estão TRAVADOS contra alterações mal-intencionadas. Clique para destravar.'
                : 'Monitores e tablets estão destravados. Clique para travar remotamente.'
            }
          >
            {screensLocked ? (
              <>
                <span className="text-sm">🔒</span>
                <span>Telas Travadas</span>
              </>
            ) : (
              <>
                <span className="text-sm">🔓</span>
                <span>Travar Telas</span>
              </>
            )}
          </button>

          {/* BOTÃO CONFIGURAÇÕES: APENAS A ENGRENAGEM COLORIDA SEM FUNDO */}
          <button 
            type="button"
            onClick={() => onOpenConfig()}
            className="p-1 rounded-xl hover:bg-slate-800/60 active:scale-95 transition-all cursor-pointer select-none flex items-center justify-center group"
            title="Configurações, Cadastro de Produtos, Preços e Fechamento de Caixa"
          >
            {/* Engrenagem colorida (sem fundo, dentes azuis e centro vermelho) */}
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 drop-shadow-md group-hover:rotate-45 transition-transform duration-300" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dentes da engrenagem em Azul */}
              <path 
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" 
                fill="#2563eb"
                stroke="#1d4ed8"
                strokeWidth="0.75"
              />
              {/* Centro da engrenagem em Vermelho */}
              <circle cx="12" cy="12" r="5" fill="#ef4444" stroke="#dc2626" strokeWidth="0.75" />
              {/* Furo central do eixo */}
              <circle cx="12" cy="12" r="2.2" fill="#991b1b" />
            </svg>
          </button>
        </div>
      </header>

      {/* NOVO RENDER CÍRCULO / BOLA GIRANDO E PULSANDO (1.5 SEGUNDOS) EXCLUSIVO PARA PEDIDOS */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={1500} />

      {/* ========================================================
          BARRA DE ATENDIMENTO AO CLIENTE (FLUXO PEDIDO MULTI-ITENS)
          SEÇÃO FIXA COM ALTURA 70% MAIOR (122px) E SEM LINHA LARANJA
          OS PEDIDOS NASCEM NA PARTE INFERIOR FIXA COM EFEITO FLUÍDO
         ======================================================== */}
      <section className="bg-slate-950/95 border-b border-slate-800/80 px-3 sm:px-4 shrink-0 shadow-xl z-20 h-[122px] max-h-[122px] flex flex-col justify-between py-2 overflow-hidden select-none">
        
        {/* LINHA 1 (SUPERIOR): NOME DO CLIENTE, PAGAMENTO, LIMPAR E FINALIZAR */}
        <div className="flex items-center justify-between gap-2 h-11 shrink-0">
          
          {/* NOME DO CLIENTE & FORMA DE PAGAMENTO */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`relative flex-1 min-w-[180px] max-w-xl ${nameShake ? 'animate-shake' : ''}`}>
              {!isNameFocused && !customerName && (
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  cart.length > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {showNameError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              )}
              <input
                ref={nameInputRef}
                type="text"
                placeholder={
                  showNameError
                    ? 'DIGITE O NOME DO CLIENTE ANTES DE FINALIZAR!'
                    : isNameFocused
                      ? ''
                      : '1º DIGITE O NOME DO CLIENTE (EX: JOÃO) *'
                }
                value={customerName}
                onFocus={() => {
                  setIsNameFocused(true);
                  setCustomerName('');
                  if (showNameError) setShowNameError(false);
                }}
                onClick={() => {
                  setIsNameFocused(true);
                  setCustomerName('');
                  if (showNameError) setShowNameError(false);
                }}
                onBlur={() => {
                  setIsNameFocused(false);
                }}
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
                className={`w-full h-11 bg-slate-900 text-white text-xs sm:text-sm font-black uppercase ${
                  !isNameFocused && !customerName ? 'pl-9' : 'pl-3'
                } pr-8 rounded-xl outline-none transition-all placeholder:font-bold placeholder:text-[11px] sm:placeholder:text-xs focus:placeholder:text-transparent border-2 ${
                  showNameError
                    ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/40 text-rose-200 placeholder:text-rose-400 glow-required-name'
                    : customerName.trim()
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20 placeholder:text-white'
                      : isNameFocused || cart.length > 0
                        ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-950/10 placeholder:text-white shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                        : 'border-amber-500/40 hover:border-amber-500/60 placeholder:text-slate-400'
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

            {/* BOTÕES DE FORMA DE PAGAMENTO: PIX, DÉBITO, CRÉDITO, DINHEIRO */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'PIX', label: 'PIX', icon: PixIcon },
                { id: 'DEBITO', label: 'DÉBITO', icon: DebitCardIcon },
                { id: 'CREDITO', label: 'CRÉDITO', icon: CreditCardIcon },
                { id: 'DINHEIRO', label: 'DINHEIRO', icon: CashIcon },
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                const IconComp = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`h-11 px-2.5 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border-2 ${
                      isSelected
                        ? 'bg-[#06090e] text-emerald-300 border-emerald-400 animate-soft-green-pulse shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                        : 'bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                    title={`Forma de pagamento: ${pm.label}`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" isSelected={isSelected} />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTÃO FINALIZAR VENDA COM VALOR NO LIMITE DIREITO (FUNDO PRETO, LETRA BRANCA) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleFinalizeCart}
              disabled={isSubmittingCart || cart.length === 0}
              className={`h-11 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between overflow-hidden transition-all shadow-xl border-2 active:scale-95 cursor-pointer ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 border-emerald-300 shadow-emerald-950/80 pl-4 pr-0'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60 px-5'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 pr-3">
                <Send className="w-4 h-4 fill-current" />
                <span>FINALIZAR PEDIDOS</span>
              </div>
              {cart.length > 0 && (
                <div className="h-full flex items-center justify-center px-3.5 bg-black text-white font-mono text-sm sm:text-base font-black border-l-2 border-emerald-300/80 animate-cart-item-birth shrink-0">
                  {formatPrice(cartTotal, showCurrencySymbol)}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* LINHA 2 (INFERIOR FIXA): ÁREA PERMANENTE ONDE OS PEDIDOS NASCEM COM EFEITO FLUÍDO */}
        <div className="h-11 border-t border-slate-800/80 pt-1 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
          {cart.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold px-1">
              <span className="p-0.5 text-slate-500 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <span className="text-[11px] sm:text-xs">
                Comanda vazia — selecione os produtos abaixo para incluir na comanda
              </span>
            </div>
          ) : (
            <>
              {/* ÍCONE DO CARRINHO (SEM BORDA E 20% MAIOR) */}
              <div className="shrink-0 p-0.5 text-amber-400 flex items-center justify-center" title="Carrinho de Compras">
                <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
              </div>

              {/* BOTÃO LIMPAR FICA ENTRE O ÍCONE DO CARRINHO E O PRIMEIRO CARD */}
              <button
                type="button"
                onClick={() => setCart([])}
                className="h-8 px-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white rounded-lg border border-rose-800/80 transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shrink-0 animate-cart-item-birth active:scale-95 shadow-sm"
                title="Limpar todos os itens da comanda atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>

              {cart.map((cItem) => {
                const itemStyle = getCartItemStyle(cItem);
                return (
                  <div
                    key={cItem.cartItemId}
                    style={itemStyle.style}
                    className={`animate-cart-item-birth border px-2.5 py-1 rounded-xl flex items-center gap-2 shrink-0 shadow-sm transition-all text-xs ${itemStyle.chip || ''}`}
                  >
                    <span className="font-bold text-white whitespace-nowrap">
                      {cItem.description}
                    </span>
                    <span 
                      style={itemStyle.priceStyle}
                      className={`font-black font-mono ${itemStyle.price || ''}`}
                    >
                      {formatPrice(cItem.unitPrice * cItem.quantity, showCurrencySymbol)}
                    </span>

                    <div className="flex items-center gap-1 bg-black/40 px-1 py-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(cItem.cartItemId, -1)}
                        className="w-4 h-4 bg-white/10 hover:bg-white/20 text-white rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-black text-white px-1">
                        {cItem.quantity}x
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(cItem.cartItemId, 1)}
                        className="w-4 h-4 bg-white/10 hover:bg-white/20 text-white rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(cItem.cartItemId)}
                      className="text-white/60 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                      title="Remover item da comanda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      {/* BARRA DE NAVEGAÇÃO / FILTRO RÁPIDO POR TIPO (ESTILO DE ABAS DO PRINT 2) */}
      <nav className="w-full bg-slate-950 px-3 sm:px-4 pt-2 pb-0 border-t border-dashed border-slate-700/80 shrink-0 relative z-20 flex items-center justify-between gap-2 flex-wrap shadow-[0_12px_28px_rgba(0,0,0,0.85),0_4px_10px_rgba(0,0,0,0.6)] border-b border-slate-800">
        {/* LINHA DE BASE NO RODAPÉ DO CABEÇALHO */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 pointer-events-none" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 py-2">
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            Tipo:
          </span>

          {/* BOTÃO TODOS */}
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-slate-800 text-amber-400 border-amber-400 font-black shadow-sm'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <span>TODOS</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
              selectedTypeFilter === 'all'
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/30 font-black'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              {totalItemsCount}
            </span>
          </button>

          {/* BOTÕES DE CADA TIPO / CATEGORIA */}
          {categories.map((c) => {
            const count = c.items?.length || 0;
            const isSelected = selectedTypeFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedTypeFilter(c.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-amber-400 border-amber-400 font-black shadow-sm'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-850/50'
                }`}
              >
                <span className="uppercase text-[11px] font-black">
                  {c.name}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isSelected
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/30 font-black'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BOTÃO RÁPIDO PARA ADICIONAR NOVO ITEM */}
        <div className="flex items-center gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => {
              const targetCat = (selectedTypeFilter !== 'all' && categories.find(c => c.id === selectedTypeFilter)) || categories[0];
              handleOpenQuickAdd(targetCat);
            }}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            title="Adicionar novo item ao cardápio"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Novo Item</span>
          </button>
        </div>
      </nav>

      {/* CORPO PRINCIPAL COM OS PRODUTOS (SELEÇÃO DIRETA COM ORGANIZAÇÃO POR TIPO) */}
      <main 
        className="flex-1 overflow-y-auto relative shadow-inner"
        style={{
          backgroundColor: bgStyle.bgColor
        }}
      >
        <div className="relative min-h-full p-2.5 sm:p-3 space-y-3.5">
          {/* Camada de Textura com Opacidade, Tamanho e Profundidade Configuráveis */}
          {bgStyle.bgImage && (
            <div 
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none transition-all duration-200"
              style={{
                backgroundImage: bgStyle.bgImage,
                backgroundRepeat: bgStyle.bgRepeat || 'repeat',
                backgroundPosition: bgStyle.bgPosition || '0 0',
                backgroundSize: bgStyle.bgSize || '460px auto',
                opacity: (bgSettings.textureOpacity ?? 100) / 100,
                filter: `contrast(${(bgSettings.textureDepth ?? 100)}%) saturate(${Math.min(140, Math.max(60, (bgSettings.textureDepth ?? 100)))}%)`,
                transform: 'translateZ(0)'
              }}
            />
          )}

          {/* Camada de Escurecimento / Clareamento */}
          {Number(bgSettings.darkness || 0) > 0 && (
            <div 
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-300"
              style={{
                opacity: (Number(bgSettings.darkness || 0)) / 100
              }}
            />
          )}

          {/* Conteúdo Real dos Produtos */}
          <div className="relative z-10">
            {/* DASHBOARD INTELIGENTE DE CARDS: ZERO ESPAÇO LIVRE DESPERDIÇADO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {displayedItems.map(({ item, category }) => {
            const inCartQty = getItemCartQuantity(item.id);
            const itemColor = item.color || getCategoryColor(category);
            const cardKey = `${category.id}_${item.id}`;
            const options = getItemOptions(category, item);
            const hasMultipleOptions = options && options.length > 1;
            const isCardActive = activeOptionCardId === cardKey;
            const isCardClosing = closingOptionCardId === cardKey;
            const isModalOpen = (isCardActive || isCardClosing) && hasMultipleOptions;

            // Preço exibido na base do card antes de clicar
            const displayPrice = hasMultipleOptions 
              ? options[0].price 
              : item.price;

            return (
              <div
                key={cardKey}
                onClick={() => handleCardClick(category, item)}
                onMouseEnter={() => handleOptionCardMouseEnter(cardKey)}
                onMouseLeave={() => handleOptionCardMouseLeave(cardKey)}
                className={`rounded-2xl bg-slate-900/95 hover:bg-slate-900 border transition-all duration-200 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.22),0_4px_12px_-2px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.3),0_6px_16px_-3px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 flex flex-col justify-between relative group min-h-[168px] overflow-hidden cursor-pointer ${
                  clickedCardId === cardKey
                    ? 'animate-card-click-glow'
                    : isCardActive && !isCardClosing
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
                      : isCardClosing
                        ? 'border-emerald-400/40 ring-1 ring-emerald-400/20'
                        : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* CONTEÚDO SUPERIOR E CORPO DO CARD COM PADDING */}
                <div className="p-3.5 pb-2.5 flex-1 flex flex-col justify-between">
                  {/* TOPO: CATEGORIA À ESQUERDA, LAPIZINHO ✏️ + X ✕ À DIREITA (+ BADGE SE ESTIVER NA COMANDA) */}
                  <div className="flex items-center justify-between gap-1.5 pb-1">
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider block font-mono truncate"
                      style={{ color: itemColor }}
                    >
                      {category.name}
                    </span>

                    <div className="flex items-center gap-1 z-10 shrink-0">
                      {/* Badge de Quantidade se estiver na comanda */}
                      {inCartQty > 0 && (
                        <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md font-mono border border-emerald-300/60 animate-cart-item-birth mr-0.5">
                          ✓ {inCartQty}x
                        </span>
                      )}

                      {/* LAPIZINHO ✏️ PARA EDITAR PREÇO RÁPIDO */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQuickEdit(category, item);
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-950/90 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700/80 hover:border-emerald-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                        title="Editar preço e dados deste item rapidamente"
                      >
                        <Pencil className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      {/* BOTÃO X ✕ PARA EXCLUIR ITEM DO CARDÁPIO */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickDeleteModal({ isOpen: true, category, itemToDelete: item });
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-950/90 hover:bg-rose-500 hover:text-white text-slate-400 hover:text-white border border-slate-700/80 hover:border-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                        title={`Excluir "${item.name}" do cardápio`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* CORPO DO CARD: ÍCONE TRANSPARENTE (SEM MOLDURA) À ESQUERDA + TEXTOS À DIREITA */}
                  <div className="flex items-center gap-3 my-1">
                    {/* Ícone 2D / PNG Direto no fundo do card (sem moldura / sem caixa cinza) */}
                    <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ProductIcon2D item={item} category={category} className="w-full h-full object-contain drop-shadow-md" />
                    </div>

                    {/* Informações: Nome e Descrição */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wide truncate leading-snug" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {item.description || 'Disponível no cardápio'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BASE DO CARD: BOTÃO SOLO DE ADICIONAR COM ANIMAÇÃO PULSANTE */}
                <div className="border-t border-b border-slate-800/80 bg-slate-950/90">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(category, item);
                    }}
                    className="w-full h-10 sm:h-11 px-3 sm:px-3.5 bg-slate-950/90 text-emerald-400 border-t border-b border-l-0 border-r-0 border-emerald-500/30 font-black transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] card-btn-pulse"
                    title={hasMultipleOptions ? `Clique para escolher as opções de ${item.name}` : `Clique para adicionar ${item.name} à comanda`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-300 shrink-0">
                      CLIQUE PARA ADICIONAR!
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 shrink-0">
                      {formatPrice(displayPrice, showCurrencySymbol)}
                    </span>
                  </button>
                </div>

                {/* ========================================================
                    MODALZINHO INTERATIVO: QUANDO O ITEM TIVER MAIS DE UMA OPÇÃO
                    "se clicar em algo que tem mais de uma opção as duas aparecem clicáveis, forçando a pessoa escolher uma"
                   ======================================================== */}
                {isModalOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute inset-0 bg-slate-950/96 backdrop-blur-md z-30 p-3 flex flex-col justify-between rounded-2xl border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.55)] ${
                      isCardClosing ? 'animate-modal-fade-out' : 'animate-fadeIn'
                    }`}
                  >
                    {/* TOPO DO MODALZINHO */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                        <span className="text-[10px] sm:text-[11px] font-black text-emerald-300 uppercase tracking-wider truncate">
                          ESCOLHA UMA OPÇÃO:
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseOptionModal}
                        className="w-5 h-5 rounded-md bg-slate-900 hover:bg-rose-500 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* AS DUAS (OU MAIS) OPÇÕES CLICÁVEIS FORÇANDO A ESCOLHA - ESTÁVEIS SEM PISCAR */}
                    <div className="grid grid-cols-2 gap-2 my-auto">
                      {options.map((opt, idx) => {
                        const isFirst = idx === 0;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddOptionToCart(category, item, opt);
                              handleCloseOptionModal();
                            }}
                            className={`py-3 px-2 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md border-2 ${
                              isFirst
                                ? 'bg-emerald-950/80 hover:bg-emerald-500 text-emerald-200 hover:text-slate-950 border-emerald-500/70 hover:border-emerald-400'
                                : 'bg-teal-950/80 hover:bg-teal-400 text-teal-200 hover:text-slate-950 border-teal-500/70 hover:border-teal-300'
                            }`}
                            title={`Escolher ${opt.name} por ${formatPrice(opt.price, showCurrencySymbol)}`}
                          >
                            <span className="text-[9px] uppercase font-black tracking-wider opacity-90">
                              {opt.name}
                            </span>
                            <span className="font-mono font-black text-sm">
                              {formatPrice(opt.price, showCurrencySymbol)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* RODAPÉ DO MODALZINHO COM O NOME DO ITEM */}
                    <div className="text-[9px] text-slate-400 text-center uppercase tracking-wider font-bold truncate">
                      {item.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ESTADO VAZIO CASO NÃO HAJA ITENS CADASTRADOS */}
          {displayedItems.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6">
              <LayoutGrid className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-300 text-base font-bold">Nenhum item cadastrado para esta visualização.</p>
              <p className="text-slate-500 text-xs mt-1">Clique abaixo para adicionar um item diretamente no cardápio.</p>
              <button
                type="button"
                onClick={() => {
                  const targetCat = (selectedTypeFilter !== 'all' && categories.find(c => c.id === selectedTypeFilter)) || categories[0];
                  handleOpenQuickAdd(targetCat);
                }}
                className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Adicionar Item Agora</span>
              </button>
            </div>
          )}
          </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          RODAPÉ DO CAIXA: 3 COLUNAS REDIMENSIONÁVEIS (ARRASTAR LINHA SUPERIOR)
          - EM PREPARAÇÃO, PRONTAS, RETIRADAS
         ======================================================== */}
      <footer 
        style={{ height: `${footerHeight}px` }}
        className="bg-slate-950 px-2.5 sm:px-3 pb-2 shrink-0 flex flex-col relative select-none z-30 shadow-[0_-12px_28px_rgba(0,0,0,0.85),0_-4px_10px_rgba(0,0,0,0.6)]"
      >
        {/* LINHA / BARRA SUPERIOR CREME (REDUZIDA EM 80% - 2px) COM SOMBRA PROJETADA SOBRE OS CARDS */}
        <div 
          onMouseDown={handleStartResize}
          onTouchStart={handleStartResize}
          className="absolute -top-1.5 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize group z-40 touch-none"
          title="Clique, segure e arraste para cima ou para baixo para ajustar a altura da seção"
        >
          {/* Linha Creme fininha (reduzida em 80%) com sombra marcante */}
          <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eace9a] shadow-[0_2px_8px_rgba(0,0,0,0.9),0_6px_20px_rgba(0,0,0,0.7)] pointer-events-none" />

          {/* Pegador central sutil para puxar */}
          <div className="relative z-10 h-1 w-16 sm:w-20 bg-slate-700/90 group-hover:bg-amber-400 group-active:bg-amber-400 rounded-full transition-all shadow-md flex items-center justify-center">
            <GripHorizontal className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-950" />
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
                {formatPrice(totalFaturado, showCurrencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 COLUNAS: EM PREPARAÇÃO (AUMENTADA EM 30%), PRONTAS, RETIRADAS */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.85fr_0.85fr] gap-2 sm:gap-2.5 flex-1 min-h-0 pt-1">
          
          {/* COLUNA 1: EM PREPARAÇÃO */}
          <div className="bg-slate-900/80 rounded-xl border border-amber-500/40 py-2 pl-2 pr-0 flex flex-col shadow-inner min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/25 shrink-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.35)] flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-emerald-400 animate-spin-pulse-green-glow" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  EM PREPARAÇÃO
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-500/30">
                {preparingList.length}
              </span>
            </div>

            <div 
              className="flex-1 overflow-y-auto pr-0 min-h-0 custom-scrollbar flex flex-col"
              style={{ gap: `${resolveSpacingPx(systemSettings?.cashierCardSpacing, 6)}px` }}
            >
              {preparingList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium pr-2">
                  Nenhum pedido em preparo
                </div>
              ) : (
                preparingList.map(order => renderFooterCard(order, false))
              )}
            </div>
          </div>

          {/* COLUNA 2: PRONTAS */}
          <div className="bg-slate-900/80 rounded-xl border border-emerald-500/40 py-2 pl-2 pr-0 flex flex-col shadow-inner min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-500/25 shrink-0 pr-2">
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

            <div 
              className="flex-1 overflow-y-auto pr-0 min-h-0 custom-scrollbar flex flex-col"
              style={{ gap: `${resolveSpacingPx(systemSettings?.cashierCardSpacing, 6)}px` }}
            >
              {readyList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium pr-2">
                  Nenhum pedido pronto
                </div>
              ) : (
                readyList.map(order => renderFooterCard(order, false))
              )}
            </div>
          </div>

          {/* COLUNA 3: RETIRADAS / ENTREGUES */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700/60 py-2 pl-2 pr-0 flex flex-col shadow-inner min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 shrink-0 pr-2">
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

            <div 
              className="flex-1 overflow-y-auto pr-0 min-h-0 custom-scrollbar flex flex-col"
              style={{ gap: `${resolveSpacingPx(systemSettings?.cashierCardSpacing, 6)}px` }}
            >
              {deliveredList.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px] font-medium pr-2">
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
                    Preço:
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
                              {formatPrice(it.price, showCurrencySymbol)}
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

      {/* ========================================================
          MODAL RÁPIDO: EDITAR ITEM / PREÇO / ÍCONE / COR (LÁPIS ✏️)
         ======================================================== */}
      {quickEditModal.isOpen && quickEditModal.item && quickEditModal.category && (
        <div 
          onClick={() => setQuickEditModal({ isOpen: false, item: null, category: null, name: '', price: '0,00', pedacoPrice: '0,00', inteiraPrice: '0,00', color: '#eab308', image: null, icon2d: null, destination: 'COZINHA' })}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-emerald-500/80 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl shadow-2xl p-5 text-slate-100 font-sans cursor-default animate-scaleUp space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Pencil className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wide">
                    Editar Item / Preço / Ícone / Cor
                  </h3>
                  <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                    {quickEditModal.category.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setQuickEditModal({ isOpen: false, item: null, category: null, name: '', price: '0,00', pedacoPrice: '0,00', inteiraPrice: '0,00', color: '#eab308', image: null, icon2d: null, destination: 'COZINHA' })}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                  Nome do Item / Sabor:
                </label>
                <input
                  type="text"
                  required
                  value={quickEditModal.name}
                  onChange={(e) => setQuickEditModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-400"
                  autoFocus
                />
              </div>

              {quickEditModal.category.id === 'pizza' ? (
                <div className="flex flex-row items-center gap-2.5 sm:gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-400 whitespace-nowrap">
                      FATIA (R$):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quickEditModal.pedacoPrice}
                      onChange={(e) => setQuickEditModal(prev => ({ ...prev, pedacoPrice: formatCurrencyMask(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm sm:text-base font-mono font-black text-amber-300 outline-none focus:border-amber-400 text-right"
                    />
                  </div>
                  <div className="h-6 w-px bg-slate-800 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <label className="text-xs font-black uppercase tracking-wider text-yellow-400 whitespace-nowrap">
                      INTEIRA (R$):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quickEditModal.inteiraPrice}
                      onChange={(e) => setQuickEditModal(prev => ({ ...prev, inteiraPrice: formatCurrencyMask(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm sm:text-base font-mono font-black text-yellow-300 outline-none focus:border-yellow-400 text-right"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <label className="text-xs font-black uppercase tracking-wider text-emerald-400 whitespace-nowrap">
                    PREÇO (R$):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quickEditModal.price}
                    onChange={(e) => setQuickEditModal(prev => ({ ...prev, price: formatCurrencyMask(e.target.value) }))}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-base font-mono font-black text-emerald-400 outline-none focus:border-emerald-400 text-right"
                  />
                </div>
              )}

              {/* ONDE O PEDIDO VAI (DESTINO DE PREPARO / COZINHA) */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>Onde o Pedido Vai (Cozinha de Preparo)</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {quickEditModal.category.name}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1">
                    <select
                      value={quickEditModal.destination || (quickEditModal.category.id === 'pizza' ? 'COZINHA' : 'none')}
                      onChange={(e) => setQuickEditModal(prev => ({ ...prev, destination: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white outline-none cursor-pointer"
                    >
                      {kitchenEnvironments.map((env) => (
                        <option key={env.id} value={env.id} className="bg-slate-900 text-amber-300 font-bold">
                          🍳 {env.name}
                        </option>
                      ))}
                      {!kitchenEnvironments.some(e => e.id === 'COZINHA') && (
                        <option value="COZINHA" className="bg-slate-900 text-amber-300 font-bold">
                          🍳 COZINHA PIZZA
                        </option>
                      )}
                      <option value="none" className="bg-slate-900 text-slate-300 font-bold">
                        📦 Balcão / Entrega Direta (Sem Cozinha)
                      </option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={quickEditApplyToCategory}
                      onChange={(e) => setQuickEditApplyToCategory(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-950 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
                      Aplicar à categoria ({quickEditModal.category.name})
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Todos os caixas enviarão os pedidos deste produto/categoria diretamente para o local selecionado.
                </p>
              </div>

              {/* SEÇÃO DE ARTE / FOTO / ÍCONE 2D */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Arte / Foto do Produto</span>
                  </label>
                  {(quickEditModal.image || quickEditModal.icon2d) && (
                    <button
                      type="button"
                      onClick={handleQuickEditClearCustomArt}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restaurar ícone padrão da categoria"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Restaurar Padrão</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Preview da Arte Atual */}
                  <div 
                    className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center p-1.5 shrink-0 shadow-lg relative overflow-hidden transition-all"
                    style={{
                      borderColor: quickEditModal.color || '#eab308',
                      backgroundColor: `${quickEditModal.color || '#eab308'}15`
                    }}
                  >
                    <ProductIcon2D
                      image={quickEditModal.image}
                      iconKey={quickEditModal.icon2d}
                      category={quickEditModal.category?.id}
                      name={quickEditModal.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Ações de Foto e Presets */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{quickEditIsProcessingImg ? 'Processando...' : 'Carregar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQuickEditImageUpload}
                          disabled={quickEditIsProcessingImg}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setQuickEditShowPresets(prev => !prev)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          quickEditShowPresets
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/60'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{quickEditShowPresets ? 'Fechar Galeria' : 'Galeria 2D (50 Ícones)'}</span>
                      </button>

                      {quickEditModal.image && (
                        <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                          <span>Foto Ativa (~{Math.max(1, Math.round((quickEditModal.image.length * 0.75) / 1024))} KB)</span>
                        </span>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={quickEditAutoRemoveBg}
                        onChange={(e) => setQuickEditAutoRemoveBg(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-slate-300">
                        Remover fundo automaticamente (efeito adesivo)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Galeria Expansível 2D */}
                {quickEditShowPresets && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 animate-fadeIn">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Toque para escolher entre os 50 ícones vetoriais 2D:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                      {PRODUCT_2D_PRESETS.map((preset) => {
                        const isSelected = quickEditModal.icon2d === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleQuickEditSelectPreset(preset.id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                            }`}
                            title={preset.label}
                          >
                            <ProductIcon2D iconKey={preset.id} className="w-7 h-7" />
                            <span className="text-[9px] font-bold text-slate-300 text-center truncate w-full">
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DE COR DE DESTAQUE: BOLINHAS METADE DO TAMANHO, TODAS NA MESMA LINHA */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cor de Destaque do Item</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block border border-white/60 shadow-sm"
                      style={{ backgroundColor: quickEditModal.color || '#eab308' }}
                    />
                    <span className="font-bold text-slate-200">
                      {ITEM_COLOR_PALETTE.find(c => c.hex.toLowerCase() === (quickEditModal.color || '#eab308').toLowerCase())?.name || quickEditModal.color}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
                  {ITEM_COLOR_PALETTE.map((col) => {
                    const isSelected = (quickEditModal.color || '#eab308').toLowerCase() === col.hex.toLowerCase();
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setQuickEditModal(prev => ({ ...prev, color: col.hex }))}
                        title={col.name}
                        className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-130 relative flex items-center justify-center cursor-pointer shrink-0 border ${
                          isSelected 
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 border-white scale-125 shadow-md z-10' 
                            : 'border-white/20 hover:border-white/80 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white stroke-[3] drop-shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickEditModal({ isOpen: false, item: null, category: null, name: '', price: '0,00', pedacoPrice: '0,00', inteiraPrice: '0,00', color: '#eab308', image: null, icon2d: null, destination: 'COZINHA' })}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/50 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HINT FLUTUANTE BONITO COM OS PEDIDOS DO CLIENTE AO PASSAR O MOUSE */}
      {hoveredOrderHint && (
        <div
          className="fixed z-[9999] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: `${hintCoords.x}px`,
            top: hintCoords.placeAbove ? 'auto' : `${hintCoords.y + 6}px`,
            bottom: hintCoords.placeAbove ? `${Math.max(8, window.innerHeight - hintCoords.y + 6)}px` : 'auto',
            width: '320px',
            maxWidth: 'calc(100vw - 24px)',
          }}
        >
          <div className="bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-2.5 shadow-2xl shadow-black/90 text-white">
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {(hoveredOrderHint.items && hoveredOrderHint.items.length > 0
                ? hoveredOrderHint.items
                : getOrderItems(hoveredOrderHint)
              ).map((it, idx) => {
                const qtyStr = String(it.quantity || 1).padStart(2, '0');
                const nameStr = it.description || it.name || it.itemName || 'Item';
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 py-1 px-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs"
                  >
                    <span className="text-amber-400 font-black shrink-0">{qtyStr}</span>
                    <span className="text-slate-500 font-bold shrink-0">-</span>
                    <span className="text-slate-100 font-normal tracking-wide break-words">
                      {nameStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
