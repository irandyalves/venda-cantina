import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Cloud, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Pizza,
  IceCream,
  UtensilsCrossed,
  Layers,
  KeyRound,
  FileSpreadsheet,
  Mail,
  UserCheck,
  ShieldCheck,
  Tv,
  Tag,
  Hash,
  Pencil,
  Check,
  Calendar,
  CalendarPlus,
  Sparkles,
  Archive,
  AlertTriangle,
  ChefHat,
  Store,
  Monitor,
  FolderPlus,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff,
  Volume2,
  Maximize2,
  BellRing,
  Clock,
  Download,
  Palette,
  Search,
  Upload,
  Image as ImageIcon,
  Eraser,
  Filter,
  Sliders,
  Sun,
  Moon,
  LayoutGrid,
  Lock,
  Unlock,
  MapPin
} from 'lucide-react';
import { storageService, formatPrice, BACKGROUND_PRESETS, getSectionBackgroundStyle, resolveSpacingPx, resolveHeightPx } from '../services/storage';
import { authService, PERFIS } from '../services/auth';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import ProductIcon2D, { PRODUCT_2D_PRESETS } from './ProductIcon2D';
import AnalogClock from './AnalogClock';
import { processProductImage } from '../utils/imageProcessor';

export const ITEM_COLOR_PALETTE = [
  { id: 'red', name: 'Vermelho', hex: '#ef4444' },
  { id: 'rose', name: 'Rosa Claro', hex: '#f43f5e' },
  { id: 'pink', name: 'Pink', hex: '#ec4899' },
  { id: 'fuchsia', name: 'Fúcsia', hex: '#d946ef' },
  { id: 'purple', name: 'Roxo', hex: '#a855f7' },
  { id: 'violet', name: 'Violeta', hex: '#8b5cf6' },
  { id: 'indigo', name: 'Índigo', hex: '#6366f1' },
  { id: 'blue', name: 'Azul', hex: '#3b82f6' },
  { id: 'sky', name: 'Celeste', hex: '#0ea5e9' },
  { id: 'cyan', name: 'Ciano', hex: '#06b6d4' },
  { id: 'teal', name: 'Verde Petróleo', hex: '#14b8a6' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981' },
  { id: 'green', name: 'Verde', hex: '#22c55e' },
  { id: 'lime', name: 'Lima', hex: '#84cc16' },
  { id: 'yellow', name: 'Amarelo', hex: '#eab308' },
  { id: 'amber', name: 'Âmbar', hex: '#f59e0b' },
  { id: 'orange', name: 'Laranja', hex: '#f97316' },
  { id: 'terracotta', name: 'Terracota', hex: '#ea580c' },
  { id: 'ruby', name: 'Rubi', hex: '#be123c' },
  { id: 'wine', name: 'Vinho', hex: '#881337' },
  { id: 'mint', name: 'Menta', hex: '#059669' },
  { id: 'ocean', name: 'Oceano', hex: '#0284c7' },
  { id: 'slate', name: 'Chumbo', hex: '#64748b' },
  { id: 'zinc', name: 'Grafite', hex: '#3f3f46' },
];

export default function ConfigModal({ isOpen, onClose, initialTab = 'products' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'products', 'firebase', 'reports', 'emails'
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showCurrencySymbol, setShowCurrencySymbol] = useState(storageService.getShowCurrencySymbol());

  useEffect(() => {
    const handleCurrencyChanged = (e) => {
      setShowCurrencySymbol(Boolean(e.detail));
    };
    window.addEventListener('cantina_currency_changed', handleCurrencyChanged);
    return () => window.removeEventListener('cantina_currency_changed', handleCurrencyChanged);
  }, []);

  const handleToggleCurrencySymbol = (checked) => {
    setShowCurrencySymbol(checked);
    storageService.setShowCurrencySymbol(checked);
    setHasUnsavedChanges(true);
    showToast(
      checked ? 'Exibição de "R$" ativada nos valores.' : 'Exibição de "R$" desativada (apenas números).',
      'Configuração salva'
    );
  };
  
  // Silencioso - toasts desativados para configurações
  const showToast = () => {};

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

  const parsePrice = (val) => parseCurrencyMask(val);

  // Estado para Edição Completa de Itens (Nome, Preço com Máscara 0,00, Prefixo, Descrição)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('0,00');
  const [editItemPrefix, setEditItemPrefix] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemName(item.name || '');
    setEditItemPrice(formatCurrencyMask(item.price || 0));
    setEditItemPrefix(item.prefix || '');
    setEditItemDesc(item.description || '');
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditItemName('');
    setEditItemPrice('0,00');
    setEditItemPrefix('');
    setEditItemDesc('');
  };

  const handleSaveEditedItem = (categoryId, itemId) => {
    const cleanName = editItemName.trim();
    if (!cleanName) {
      showToast('O nome do item é obrigatório!', 'Atenção', 'error');
      return;
    }

    const priceNum = parseCurrencyMask(editItemPrice);
    const cleanPrefix = editItemPrefix.trim();
    const cleanDesc = editItemDesc.trim();

    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: (cat.items || []).map(it => {
            if (it.id === itemId) {
              return {
                ...it,
                name: cleanName,
                price: priceNum || it.price,
                prefix: cleanPrefix || null,
                description: cleanDesc || it.description || null
              };
            }
            return it;
          })
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    handleCancelEditItem();
    showToast(`Item "${cleanName}" atualizado com sucesso!`, 'Item Atualizado');
  };

  // Estado Firebase Config
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [firebaseStatus, setFirebaseStatus] = useState(null);

  // Estado Ambientes e Perfis
  const [environments, setEnvironments] = useState(() => authService.getEnvironments());
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [showEditEnvModal, setShowEditEnvModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvType, setNewEnvType] = useState('kitchen'); // 'kitchen', 'cashier', 'display'
  const [newEnvDesc, setNewEnvDesc] = useState('');
  const [newEnvLinkedKitchen, setNewEnvLinkedKitchen] = useState('');
  const [editingEnv, setEditingEnv] = useState(null);
  const [deleteEnvConfirmModal, setDeleteEnvConfirmModal] = useState({ isOpen: false, env: null });

  // Estado Perfis e Emails
  const [emailRules, setEmailRules] = useState(authService.getEmailRules());
  const [selectedProfileForEmail, setSelectedProfileForEmail] = useState(PERFIS.ADMIN);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Estado Cadastro de Novas Categorias (Salada, Pão na Chapa, etc.)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [newCatPrefixInput, setNewCatPrefixInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteCatConfirmModal, setDeleteCatConfirmModal] = useState({ isOpen: false, category: null });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Prefixos das Senhas (Comandas)
  const [pedacoPrefix, setPedacoPrefix] = useState('Pp-');
  const [inteiraPrefix, setInteiraPrefix] = useState('Pi-');
  const [acaiPrefix, setAcaiPrefix] = useState('A-');
  const [batataPrefix, setBatataPrefix] = useState('B-');

  // Estado Novo Sabor de Pizza
  const [newPizzaFlavor, setNewPizzaFlavor] = useState('');
  const [newPizzaDesc, setNewPizzaDesc] = useState('');
  const [newPizzaPrefix, setNewPizzaPrefix] = useState('');

  // Estado Novo Item de Açaí (Preço com máscara 0,00)
  const [newAcaiName, setNewAcaiName] = useState('');
  const [newAcaiPrice, setNewAcaiPrice] = useState('0,00');
  const [newAcaiPrefix, setNewAcaiPrefix] = useState('A-');

  // Estado Novo Item de Batata (Preço com máscara 0,00)
  const [newBatataName, setNewBatataName] = useState('');
  const [newBatataPrice, setNewBatataPrice] = useState('0,00');
  const [newBatataPrefix, setNewBatataPrefix] = useState('B-');

  // Estado Configurações da TV e Cozinha
  const [tvSettings, setTvSettings] = useState(storageService.getTVSettings());
  const [kitchenSettings, setKitchenSettings] = useState(() => storageService.getKitchenSettings());
  const [productionRouting, setProductionRouting] = useState(() => storageService.getProductionRouting());

  // Estado Evento da Cantina
  const [currentEvent, setCurrentEvent] = useState(() => storageService.getCurrentEvent());
  const [eventsList, setEventsList] = useState(() => storageService.getEventsList());
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado Modal de Zerar Turno e Histórico Arquivado
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearQueueModal, setShowClearQueueModal] = useState(false);
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [turnoHistory, setTurnoHistory] = useState(() => storageService.getTurnoHistory());
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [selectedTurnoForConference, setSelectedTurnoForConference] = useState(null);
  const [reopenTurnoConfirmModal, setReopenTurnoConfirmModal] = useState({ isOpen: false, turno: null });
  const [isReopeningTurno, setIsReopeningTurno] = useState(false);

  // Preços de pizza (Pedaço e Inteira com máscara 0,00)
  const [pedacoPrice, setPedacoPrice] = useState('9,00');
  const [inteiraPrice, setInteiraPrice] = useState('48,00');
  const [reportDateFilter, setReportDateFilter] = useState('all');

  // Modal de Adicionar Item para Venda
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('pizza');
  const [newItemDestination, setNewItemDestination] = useState('COZINHA');
  const [newItemPrice, setNewItemPrice] = useState('0,00');
  const [newItemPrefix, setNewItemPrefix] = useState('Pp-');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemColor, setNewItemColor] = useState('#eab308');
  const [colorPickerItemId, setColorPickerItemId] = useState(null);

  // Modal de Configurações Completas do Item (Engrenagem ⚙️)
  const [showGearModal, setShowGearModal] = useState(false);
  const [gearItemData, setGearItemData] = useState({
    id: '',
    name: '',
    price: '0,00',
    prefix: '',
    description: '',
    categoryId: 'acai',
    isVariation: false,
    variationId: null,
    color: '#eab308',
    image: null,
    icon2d: null,
    destination: 'COZINHA'
  });
  const [confirmDeleteGear, setConfirmDeleteGear] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Estado do Modal Bonito de Confirmação de Exclusão de Venda (Substitui window.confirm)
  const [cancelConfirmModal, setCancelConfirmModal] = useState({
    isOpen: false,
    order: null
  });

  // Estado do Modal de Confirmação de Exclusão de Item do Cardápio
  const [deleteItemConfirmModal, setDeleteItemConfirmModal] = useState({
    isOpen: false,
    item: null
  });

  // Estado e lógica de ordenação da tabela de fechamento de caixa
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estado Limites de Tempo e Cores dos Pedidos (Cozinha)
  const [orderTimeLimits, setOrderTimeLimits] = useState(() => storageService.getOrderTimeLimits());

  // Estado do Fundo da Seção dos Cards (Caixa)
  const [bgSettings, setBgSettings] = useState(() => storageService.getBackgroundSettings());
  const previewBgStyle = getSectionBackgroundStyle(bgSettings);

  const handleUpdateBgSetting = (key, val) => {
    const nextSettings = {
      ...bgSettings,
      [key]: val
    };
    setBgSettings(nextSettings);
    storageService.saveBackgroundSettings(nextSettings);
    setHasUnsavedChanges(true);
  };

  const bgUploadInputRef = useRef(null);

  const handleUploadBgFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        const nextSettings = {
          ...bgSettings,
          theme: 'upload',
          customImage: base64
        };
        setBgSettings(nextSettings);
        storageService.saveBackgroundSettings(nextSettings);
        setHasUnsavedChanges(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedBg = () => {
    const nextSettings = {
      ...bgSettings,
      theme: 'cream',
      customImage: ''
    };
    setBgSettings(nextSettings);
    storageService.saveBackgroundSettings(nextSettings);
    setHasUnsavedChanges(true);
  };

  // Estado Geral do Sistema (Fundo, Efeitos, Tempos, Fontes, Distância de Cards)
  const [systemSettings, setSystemSettings] = useState(() => storageService.getSystemSettings());
  const [screensLocked, setScreensLocked] = useState(() => storageService.isScreensLocked());
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('pt-BR', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleScreensLock = async () => {
    const nextState = !screensLocked;
    await storageService.setScreensLocked(nextState);
  };

  const handleUpdateSystemSetting = (key, val) => {
    const nextSettings = {
      ...systemSettings,
      [key]: val
    };
    setSystemSettings(nextSettings);
    storageService.saveSystemSettings(nextSettings);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab]);

  // Escuta atualizações de pedidos, ambientes, histórico e roteamento em tempo real (vindos de outros dispositivos ou da nuvem)
  useEffect(() => {
    const unsubOrders = storageService.subscribeOrders((all) => {
      setOrders(all);
    });

    const handleEnvsChange = (e) => {
      setEnvironments(e.detail || authService.getEnvironments());
    };
    const handleRoutingChange = (e) => {
      setProductionRouting(e.detail || storageService.getProductionRouting());
    };
    const handleHistoryChange = (e) => {
      setTurnoHistory(e.detail || storageService.getTurnoHistory());
    };
    const handleProductsChange = (e) => {
      if (e.detail) setCategories(e.detail);
    };
    const handleEventChange = (e) => {
      if (e.detail) setCurrentEvent(e.detail);
    };
    const handleEventsListChange = (e) => {
      if (e.detail) setEventsList(e.detail);
    };
    const handleLimitsChange = (e) => {
      setOrderTimeLimits(e.detail || storageService.getOrderTimeLimits());
    };
    const handleBgChange = (e) => {
      setBgSettings(e.detail || storageService.getBackgroundSettings());
    };
    const handleSystemChange = (e) => {
      setSystemSettings(e.detail || storageService.getSystemSettings());
    };
    const handleScreensLockChange = (e) => {
      setScreensLocked(!!e.detail);
    };

    window.addEventListener('cantina_environments_changed', handleEnvsChange);
    window.addEventListener('cantina_production_routing_changed', handleRoutingChange);
    window.addEventListener('cantina_turno_history_changed', handleHistoryChange);
    window.addEventListener('cantina_products_changed', handleProductsChange);
    window.addEventListener('cantina_event_changed', handleEventChange);
    window.addEventListener('cantina_events_list_changed', handleEventsListChange);
    window.addEventListener('cantina_order_time_limits_changed', handleLimitsChange);
    window.addEventListener('cantina_background_settings_changed', handleBgChange);
    window.addEventListener('cantina_system_settings_changed', handleSystemChange);
    window.addEventListener('cantina_screens_locked_changed', handleScreensLockChange);

    return () => {
      unsubOrders();
      window.removeEventListener('cantina_environments_changed', handleEnvsChange);
      window.removeEventListener('cantina_production_routing_changed', handleRoutingChange);
      window.removeEventListener('cantina_turno_history_changed', handleHistoryChange);
      window.removeEventListener('cantina_products_changed', handleProductsChange);
      window.removeEventListener('cantina_event_changed', handleEventChange);
      window.removeEventListener('cantina_events_list_changed', handleEventsListChange);
      window.removeEventListener('cantina_order_time_limits_changed', handleLimitsChange);
      window.removeEventListener('cantina_background_settings_changed', handleBgChange);
      window.removeEventListener('cantina_system_settings_changed', handleSystemChange);
      window.removeEventListener('cantina_screens_locked_changed', handleScreensLockChange);
    };
  }, []);

  // Fechar com tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (deleteItemConfirmModal.isOpen) {
          setDeleteItemConfirmModal({ isOpen: false, item: null });
          return;
        }
        if (deleteEnvConfirmModal.isOpen) {
          setDeleteEnvConfirmModal({ isOpen: false, env: null });
          return;
        }
        if (showAddEnvModal) {
          setShowAddEnvModal(false);
          return;
        }
        if (showEditEnvModal) {
          setShowEditEnvModal(false);
          return;
        }
        if (showAddCategoryModal) {
          setShowAddCategoryModal(false);
          return;
        }
        if (cancelConfirmModal.isOpen) {
          setCancelConfirmModal({ isOpen: false, order: null });
          return;
        }
        if (showAddItemModal) {
          setShowAddItemModal(false);
          return;
        }
        if (showGearModal) {
          setShowGearModal(false);
          return;
        }
        if (showResetModal) {
          setShowResetModal(false);
          return;
        }
        if (showDeleteHistoryModal) {
          setShowDeleteHistoryModal(false);
          return;
        }
        if (showClearQueueModal) {
          setShowClearQueueModal(false);
          return;
        }
        if (editingItemId) {
          handleCancelEditItem();
          return;
        }
        handleSafeClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cancelConfirmModal.isOpen, deleteItemConfirmModal.isOpen, deleteEnvConfirmModal.isOpen, showAddEnvModal, showEditEnvModal, showAddCategoryModal, showAddItemModal, showGearModal, showResetModal, showClearQueueModal, editingItemId, onClose, hasUnsavedChanges, categories, productionRouting, orderTimeLimits, kitchenSettings, tvSettings, bgSettings, systemSettings]);

  function loadData() {
    const cats = storageService.getProducts();
    // Normalizar caso o banco local tenha o antigo 'PP-' ou 'PI-' em maiúsculo
    const normalizedCats = cats.map(cat => {
      if (cat.id === 'pizza' && cat.variations) {
        return {
          ...cat,
          variations: cat.variations.map(v => {
            if (v.id === 'pedaco' && (v.prefix === 'PP-' || v.prefix === 'PP')) return { ...v, prefix: 'Pp-' };
            if (v.id === 'inteira' && (v.prefix === 'PI-' || v.prefix === 'PI')) return { ...v, prefix: 'Pi-' };
            return v;
          })
        };
      }
      return cat;
    });
    setCategories(normalizedCats);

    const pizzaCat = normalizedCats.find(c => c.id === 'pizza');
    if (pizzaCat && pizzaCat.variations) {
      const p = pizzaCat.variations.find(v => v.id === 'pedaco');
      const i = pizzaCat.variations.find(v => v.id === 'inteira');
      if (p) {
        setPedacoPrice(formatCurrencyMask(p.price));
        setPedacoPrefix(p.prefix === 'PP-' ? 'Pp-' : (p.prefix || 'Pp-'));
      }
      if (i) {
        setInteiraPrice(formatCurrencyMask(i.price));
        setInteiraPrefix(i.prefix === 'PI-' ? 'Pi-' : (i.prefix || 'Pi-'));
      }
    }

    const acaiC = cats.find(c => c.id === 'acai');
    if (acaiC) {
      setAcaiPrefix(acaiC.prefixDefault || 'A-');
      setNewAcaiPrefix(acaiC.prefixDefault || 'A-');
    }

    const batataC = cats.find(c => c.id === 'batata');
    if (batataC) {
      setBatataPrefix(batataC.prefixDefault || 'B-');
      setNewBatataPrefix(batataC.prefixDefault || 'B-');
    }

    const savedFb = storageService.getFirebaseConfig();
    if (savedFb) {
      setFirebaseConfig(savedFb);
      setFirebaseStatus({ success: true, message: 'Configuração conectada ao Firebase.' });
    }

    setEmailRules(authService.getEmailRules());
    setEnvironments(authService.getEnvironments());
    setTvSettings(storageService.getTVSettings());
    setKitchenSettings(storageService.getKitchenSettings());
    setProductionRouting(storageService.getProductionRouting());
    setCurrentEvent(storageService.getCurrentEvent());
    setEventsList(storageService.getEventsList());
    setTurnoHistory(storageService.getTurnoHistory());
    setOrders(storageService.getLocalOrders());
    setOrderTimeLimits(storageService.getOrderTimeLimits());
    setSystemSettings(storageService.getSystemSettings());
    setBgSettings(storageService.getBackgroundSettings());
    setScreensLocked(storageService.isScreensLocked());
  };

  if (!isOpen) return null;

  // --- AÇÕES DE TEMPO E CORES DOS PEDIDOS NA COZINHA (REGRA INTELIGENTE PROGRESSIVA) ---
  const handleUpdateOrderTimeLimits = (field, val) => {
    if (val === '') {
      setOrderTimeLimits(prev => ({ ...prev, [field]: '' }));
      setHasUnsavedChanges(true);
      return;
    }
    const num = Math.max(1, parseInt(val, 10) || 1);
    setOrderTimeLimits(prev => {
      let green = field === 'greenLimit' ? num : (parseInt(prev.greenLimit, 10) || 1);
      let blue = field === 'blueLimit' ? Math.max(green + 1, num) : (parseInt(prev.blueLimit, 10) || (green + 3));
      let yellow = field === 'yellowLimit' ? Math.max(blue + 1, num) : (parseInt(prev.yellowLimit, 10) || (blue + 4));
      let orange = field === 'orangeLimit' ? Math.max(yellow + 1, num) : (parseInt(prev.orangeLimit, 10) || (yellow + 5));

      // Regra inteligente progressiva: cada limite posterior é estritamente maior
      if (field === 'greenLimit') {
        if (blue <= green) blue = green + 5;
        if (yellow <= blue) yellow = blue + 5;
        if (orange <= yellow) orange = yellow + 10;
      } else if (field === 'blueLimit') {
        if (yellow <= blue) yellow = blue + 5;
        if (orange <= yellow) orange = yellow + 10;
      } else if (field === 'yellowLimit') {
        if (orange <= yellow) orange = yellow + 5;
      }

      const next = {
        greenLimit: green,
        blueLimit: blue,
        yellowLimit: yellow,
        orangeLimit: orange
      };
      storageService.saveOrderTimeLimits(next);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleBlurOrderTimeLimits = () => {
    setOrderTimeLimits(prev => {
      const green = Math.max(1, parseInt(prev.greenLimit, 10) || 3);
      const blue = Math.max(green + 1, parseInt(prev.blueLimit, 10) || (green + 3));
      const yellow = Math.max(blue + 1, parseInt(prev.yellowLimit, 10) || (blue + 4));
      const orange = Math.max(yellow + 1, parseInt(prev.orangeLimit, 10) || (yellow + 5));
      const safe = { greenLimit: green, blueLimit: blue, yellowLimit: yellow, orangeLimit: orange };
      storageService.saveOrderTimeLimits(safe);
      return safe;
    });
  };

  const handleSaveOrderTimeLimits = () => {
    storageService.saveOrderTimeLimits(orderTimeLimits);
    setHasUnsavedChanges(false);
    showToast('Tempos e cores dos pedidos salvos com sucesso!', 'Configuração Salva');
  };

  const handleResetOrderTimeLimits = () => {
    const defaults = { greenLimit: 3, blueLimit: 6, yellowLimit: 10, orangeLimit: 15 };
    setOrderTimeLimits(defaults);
    storageService.saveOrderTimeLimits(defaults);
    setHasUnsavedChanges(true);
    showToast('Tempos restaurados para o padrão!', 'Padrão Restaurado');
  };

  // Salvar tudo de forma centralizada (Garante que tudo seja persistido e fecha o modal)
  const handleSaveAll = () => {
    storageService.saveProducts(categories);
    storageService.saveProductionRouting(productionRouting);
    storageService.saveOrderTimeLimits(orderTimeLimits);
    storageService.saveKitchenSettings(kitchenSettings);
    storageService.saveTVSettings(tvSettings);
    storageService.saveBackgroundSettings(bgSettings);
    storageService.saveSystemSettings(systemSettings);
    setHasUnsavedChanges(false);
    showToast('Todas as alterações foram salvas com sucesso!', 'Salvo com Sucesso', 'success');
    if (onClose) onClose();
  };

  // Fechamento seguro: se houver alterações, salva automaticamente antes de fechar
  const handleSafeClose = () => {
    if (hasUnsavedChanges) {
      storageService.saveProducts(categories);
      storageService.saveProductionRouting(productionRouting);
      storageService.saveOrderTimeLimits(orderTimeLimits);
      storageService.saveKitchenSettings(kitchenSettings);
      storageService.saveTVSettings(tvSettings);
      storageService.saveBackgroundSettings(bgSettings);
      storageService.saveSystemSettings(systemSettings);
      setHasUnsavedChanges(false);
    }
    if (onClose) onClose();
  };

  // --- AÇÕES DE CONFIGURAÇÃO DA TV E COZINHA ---
  const handleToggleTVSound = () => {
    const updated = { ...tvSettings, soundEnabled: !tvSettings.soundEnabled };
    setTvSettings(updated);
    storageService.saveTVSettings(updated);
  };

  const handleToggleTVDelivered = () => {
    const updated = { ...tvSettings, showDelivered: !tvSettings.showDelivered };
    setTvSettings(updated);
    storageService.saveTVSettings(updated);
  };

  const handleToggleTVFullscreen = () => {
    const updated = { ...tvSettings, autoFullscreen: !tvSettings.autoFullscreen };
    setTvSettings(updated);
    storageService.saveTVSettings(updated);
  };

  const handleToggleKitchenSound = () => {
    const updated = { ...kitchenSettings, soundEnabled: !kitchenSettings.soundEnabled };
    setKitchenSettings(updated);
    storageService.saveKitchenSettings(updated);
    showToast(updated.soundEnabled ? 'Som da Cozinha ativado!' : 'Som da Cozinha em silêncio/mudo.');
  };

  // --- AÇÕES DE DESTINO DE PRODUÇÃO (COZINHA, COZINHA 2, BALCÃO, ETC.) ---
  const handleChangeItemDestination = (targetId, newDestEnvId, itemName) => {
    const current = storageService.getProductionRouting();
    const isKitchen = newDestEnvId !== 'none';
    const updated = {
      ...current,
      destinationEnv: {
        ...(current.destinationEnv || {}),
        [targetId]: newDestEnvId
      },
      sendToKitchen: {
        ...(current.sendToKitchen || {}),
        [targetId]: isKitchen
      }
    };
    setProductionRouting(updated);
    storageService.saveProductionRouting(updated);

    const envObj = environments.find(e => e.id === newDestEnvId);
    const destName = envObj ? envObj.name : (isKitchen ? newDestEnvId : 'Balcão (Sem Preparo)');
    showToast(
      isKitchen 
        ? `"${itemName}" agora será enviado para: ${destName}!` 
        : `"${itemName}" agora será entrega direta no Balcão.`,
      'Destino de Preparo',
      'info'
    );
  };

  const handleToggleItemKitchen = (targetId, newValue) => {
    const current = storageService.getProductionRouting();
    const updated = {
      ...current,
      sendToKitchen: {
        ...current.sendToKitchen,
        [targetId]: newValue
      },
      destinationEnv: {
        ...(current.destinationEnv || {}),
        [targetId]: newValue ? 'COZINHA' : 'none'
      }
    };
    setProductionRouting(updated);
    storageService.saveProductionRouting(updated);
    showToast(
      newValue ? 'Item será ENVIADO PARA A COZINHA!' : 'Item será entregue direto no BALCÃO (Sem envio para preparo).',
      'Destino de Produção',
      'info'
    );
  };

  const handleToggleItemTV = (targetId, newValue) => {
    const current = storageService.getProductionRouting();
    const updated = {
      ...current,
      showOnTV: {
        ...current.showOnTV,
        [targetId]: newValue
      }
    };
    setProductionRouting(updated);
    storageService.saveProductionRouting(updated);
    showToast(
      newValue ? 'Item será EXIBIDO NO PAINEL TV!' : 'Item OCULTADO do Painel TV.',
      'Exibição na TV',
      'info'
    );
  };

  const handleResetProductionRouting = () => {
    const defaultRouting = {
      sendToKitchen: {
        'pizza': true,
        'pedaco': true,
        'inteira': true,
        'acai': false,
        'batata': false,
        'outros': false
      },
      showOnTV: {
        'pizza': true,
        'pedaco': true,
        'inteira': true,
        'acai': false,
        'batata': false,
        'outros': false
      },
      destinationEnv: {
        'pizza': 'COZINHA',
        'pedaco': 'COZINHA',
        'inteira': 'COZINHA',
        'acai': 'none',
        'batata': 'none',
        'outros': 'none'
      }
    };
    setProductionRouting(defaultRouting);
    storageService.saveProductionRouting(defaultRouting);
    showToast('Padrão restaurado: Pizza na Cozinha, Açaí e Batata no Balcão!', 'Destino Restaurado');
  };

  // --- AÇÕES DE E-MAILS DOS PERFIS ---
  const handleAddEmail = (e) => {
    e.preventDefault();
    const email = newEmailInput.trim().toLowerCase();
    if (!email) return;

    authService.addEmailToProfile(selectedProfileForEmail, email);
    setEmailRules(authService.getEmailRules());
    setNewEmailInput('');
  };

  const handleRemoveEmail = (profile, email) => {
    authService.removeEmailFromProfile(profile, email);
    setEmailRules(authService.getEmailRules());
  };

  // --- AÇÕES DE GESTÃO DE AMBIENTES (CADASTRO E CONFIGURAÇÃO) ---
  const handleCreateEnvironment = (e) => {
    if (e) e.preventDefault();
    const cleanName = newEnvName.trim();
    if (!cleanName) {
      showToast('O nome do ambiente é obrigatório (ex: COZINHA 2)!', 'Atenção', 'error');
      return;
    }
    try {
      const created = authService.addEnvironment({
        name: cleanName,
        shortName: cleanName,
        type: newEnvType,
        description: newEnvDesc.trim(),
        linkedKitchen: newEnvType === 'display' ? newEnvLinkedKitchen : ''
      });
      setEnvironments(authService.getEnvironments());
      setEmailRules(authService.getEmailRules());
      setShowAddEnvModal(false);
      setNewEnvName('');
      setNewEnvType('kitchen');
      setNewEnvDesc('');
      setNewEnvLinkedKitchen('');
      showToast(`Ambiente "${created.name}" cadastrado com sucesso!`, 'Ambiente Criado');
    } catch (err) {
      showToast(err.message, 'Erro', 'error');
    }
  };

  const handleStartEditEnv = (env) => {
    setEditingEnv({
      id: env.id,
      name: env.name || '',
      shortName: env.shortName || '',
      type: env.type || 'kitchen',
      description: env.description || '',
      linkedKitchen: env.linkedKitchen || '',
      isSystem: Boolean(env.isSystem)
    });
    setShowEditEnvModal(true);
  };

  const handleSaveEditEnv = (e) => {
    if (e) e.preventDefault();
    if (!editingEnv) return;
    const cleanName = editingEnv.name.trim();
    if (!cleanName) {
      showToast('O nome do ambiente é obrigatório!', 'Atenção', 'error');
      return;
    }
    try {
      authService.updateEnvironment(editingEnv.id, {
        name: cleanName,
        shortName: cleanName,
        type: editingEnv.type,
        description: (editingEnv.description || '').trim(),
        linkedKitchen: editingEnv.type === 'display' ? (editingEnv.linkedKitchen || '') : ''
      });
      setEnvironments(authService.getEnvironments());
      setShowEditEnvModal(false);
      setEditingEnv(null);
      showToast(`Ambiente "${cleanName}" atualizado com sucesso!`, 'Ambiente Atualizado');
    } catch (err) {
      showToast(err.message, 'Erro', 'error');
    }
  };

  const handleOpenDeleteEnvConfirm = (env) => {
    if (env.isSystem) {
      showToast('Ambientes padrão do sistema (ADMIN, COZINHA, PÚBLICO) não podem ser excluídos.', 'Aviso', 'info');
      return;
    }
    setDeleteEnvConfirmModal({ isOpen: true, env });
  };

  const handleConfirmDeleteEnv = () => {
    const env = deleteEnvConfirmModal.env;
    if (!env) return;
    try {
      authService.deleteEnvironment(env.id);
      setEnvironments(authService.getEnvironments());
      setEmailRules(authService.getEmailRules());
      setDeleteEnvConfirmModal({ isOpen: false, env: null });
      showToast(`Ambiente "${env.name}" removido com sucesso!`, 'Ambiente Removido');
    } catch (err) {
      showToast(err.message, 'Erro', 'error');
    }
  };

  // --- AÇÃO DE CADASTRO DE NOVA CATEGORIA (SALADA, PÃO NA CHAPA, ETC.) ---
  const handleCreateNewCategory = (e) => {
    if (e) e.preventDefault();
    const cleanName = newCatNameInput.trim();
    if (!cleanName) {
      showToast('Digite o nome da nova categoria (ex: Salada, Pão na Chapa)!', 'Atenção', 'error');
      return;
    }

    const catSlug = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');
    if (categories.some(c => c.id === catSlug)) {
      showToast(`A categoria "${cleanName}" já existe!`, 'Atenção', 'error');
      return;
    }

    const cleanPrefix = newCatPrefixInput.trim() || `${cleanName.substring(0, 3).toUpperCase()}-`;
    const newCat = {
      id: catSlug,
      name: cleanName.toUpperCase(),
      icon: 'Utensils',
      prefixDefault: cleanPrefix,
      items: [],
      variations: []
    };

    const updated = [...categories, newCat];
    storageService.saveProducts(updated);
    setCategories(updated);
    setShowAddCategoryModal(false);
    setNewCatNameInput('');
    setNewCatPrefixInput('');
    showToast(`Categoria "${newCat.name}" criada com sucesso! Você já pode adicionar itens nela.`, 'Categoria Criada');
  };

  const handleDeleteCategory = (cat) => {
    if (!cat) return;
    if (['pizza', 'acai', 'batata'].includes(cat.id)) {
      showToast('Categorias padrão do sistema não podem ser excluídas.', 'Atenção', 'error');
      return;
    }

    const updated = categories.filter(c => c.id !== cat.id);
    storageService.saveProducts(updated);
    setCategories(updated);
    setDeleteCatConfirmModal({ isOpen: false, category: null });
    showToast(`Categoria "${cat.name}" excluída com sucesso!`, 'Categoria Excluída');
  };

  // Abrir Modal de Configurações Completas do Item (Engrenagem ⚙️ / Lápis ✏️)
  const handleOpenGearModal = (item) => {
    setConfirmDeleteGear(false);
    setShowPresetPicker(false);
    const targetId = item.isVariation ? item.variationId : item.id;
    const catId = item.categoryId || 'acai';
    const routing = storageService.getProductionRouting();
    const isToKitchen = routing.sendToKitchen?.[targetId] !== undefined
      ? routing.sendToKitchen[targetId]
      : (routing.sendToKitchen?.[catId] !== undefined ? routing.sendToKitchen[catId] : (catId === 'pizza'));
    const isToTV = routing.showOnTV?.[targetId] !== undefined
      ? routing.showOnTV[targetId]
      : (routing.showOnTV?.[catId] !== undefined ? routing.showOnTV[catId] : (catId === 'pizza'));
    const currentDest = routing.destinationEnv?.[targetId] !== undefined
      ? routing.destinationEnv[targetId]
      : (routing.destinationEnv?.[catId] !== undefined 
          ? routing.destinationEnv[catId] 
          : (isToKitchen ? 'COZINHA' : 'none'));

    // Busca o item ou variação original nas categorias para garantir a imagem e ícone mais recentes
    let realItem = null;
    if (item.isVariation) {
      const pCat = categories.find(c => c.id === 'pizza');
      realItem = pCat?.variations?.find(v => v.id === item.variationId);
    } else {
      for (const cat of categories) {
        const found = (cat.items || []).find(it => it.id === item.id);
        if (found) {
          realItem = found;
          break;
        }
      }
    }

    setGearItemData({
      id: item.id,
      name: item.name || realItem?.name || '',
      price: formatCurrencyMask(item.price !== undefined ? item.price : (realItem?.price || 0)),
      prefix: item.prefix || realItem?.prefix || '',
      description: item.description || realItem?.description || '',
      categoryId: catId,
      isVariation: Boolean(item.isVariation),
      variationId: item.variationId || null,
      destination: currentDest,
      sendToKitchen: currentDest !== 'none',
      showOnTV: isToTV,
      color: item.color || realItem?.color || '#eab308',
      image: item.image || realItem?.image || null,
      icon2d: item.icon2d || realItem?.icon2d || null
    });
    setShowGearModal(true);
  };

  // Funções de processamento de imagem e presets de arte 2D
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImage(true);
      const result = await processProductImage(file, {
        removeBackground: autoRemoveBg,
        maxSize: 180,
        quality: 0.82
      });
      const dataUrl = typeof result === 'string' ? result : (result?.dataUrl || '');
      setGearItemData(prev => ({
        ...prev,
        image: dataUrl,
        icon2d: null
      }));
      const sizeMsg = result?.sizeKb ? ` (~${result.sizeKb} KB - reduzido para o banco)` : ' - reduzido para o banco';
      showToast(`Nova foto carregada com sucesso!${sizeMsg}`, 'Imagem do Produto', 'success');
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      showToast('Não foi possível processar a imagem do produto.', 'Erro ao Carregar', 'error');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleSelectPreset = (presetId) => {
    setGearItemData(prev => ({
      ...prev,
      icon2d: presetId,
      image: null
    }));
    setShowPresetPicker(false);
    showToast('Ícone 2D selecionado com sucesso!', 'Ícone Definido');
  };

  const handleClearCustomArt = () => {
    setGearItemData(prev => ({
      ...prev,
      image: null,
      icon2d: null
    }));
    showToast('Arte restaurada para o ícone padrão automático.', 'Padrão Restaurado');
  };

  // Salvar alterações da Engrenagem ⚙️ / Lápis ✏️
  const handleSaveGearModal = (e) => {
    if (e) e.preventDefault();
    const cleanName = gearItemData.name.trim();
    if (!cleanName) {
      showToast('O nome do item é obrigatório!', 'Atenção', 'error');
      return;
    }
    const priceNum = parseCurrencyMask(gearItemData.price);
    const cleanPrefix = gearItemData.prefix.trim();
    const cleanDesc = gearItemData.description.trim();
    const itemColor = gearItemData.color || '#eab308';
    const itemImage = gearItemData.image || null;
    const itemIcon2d = gearItemData.icon2d || null;

    // Salva alterações do item
    let updated;
    if (gearItemData.isVariation && gearItemData.categoryId === 'pizza') {
      updated = categories.map(cat => {
        if (cat.id === 'pizza') {
          return {
            ...cat,
            variations: (cat.variations || []).map(v => {
              if (v.id === gearItemData.variationId) {
                return {
                  ...v,
                  name: cleanName.replace(/^Pizza\s+/i, ''),
                  price: priceNum,
                  prefix: cleanPrefix,
                  color: itemColor,
                  image: itemImage,
                  icon2d: itemIcon2d
                };
              }
              return v;
            })
          };
        }
        return cat;
      });
    } else {
      // 1. Obter dados do item atualizado
      let updatedItem = null;
      for (const cat of categories) {
        const found = (cat.items || []).find(it => it.id === gearItemData.id);
        if (found) {
          updatedItem = {
            ...found,
            name: cleanName,
            price: priceNum,
            prefix: cleanPrefix,
            description: cleanDesc,
            color: itemColor,
            image: itemImage,
            icon2d: itemIcon2d,
            categoryId: gearItemData.categoryId
          };
          break;
        }
      }

      if (!updatedItem) {
        updatedItem = {
          id: gearItemData.id,
          name: cleanName,
          price: priceNum,
          prefix: cleanPrefix,
          description: cleanDesc,
          color: itemColor,
          image: itemImage,
          icon2d: itemIcon2d,
          categoryId: gearItemData.categoryId
        };
      }

      // 2. Atualizar categorias (removendo da antiga se mudou e inserindo na nova)
      updated = categories.map(cat => {
        let items = (cat.items || []).filter(it => it.id !== gearItemData.id);
        let variations = cat.variations || [];
        if (gearItemData.isVariation && cat.id === 'pizza' && gearItemData.categoryId !== 'pizza') {
          variations = variations.filter(v => v.id !== gearItemData.variationId);
        }
        if (cat.id === gearItemData.categoryId) {
          items = [...items, updatedItem];
        }
        return {
          ...cat,
          variations,
          items
        };
      });
    }

    if (gearItemData.isVariation) {
      if (gearItemData.variationId === 'pedaco') {
        setPedacoPrice(formatCurrencyMask(priceNum));
        setPedacoPrefix(cleanPrefix);
      } else if (gearItemData.variationId === 'inteira') {
        setInteiraPrice(formatCurrencyMask(priceNum));
        setInteiraPrefix(cleanPrefix);
      }
    }

    // Salva roteamento de produção (Cozinha vs Tenda / TV)
    const targetId = gearItemData.isVariation ? gearItemData.variationId : gearItemData.id;
    const currentRouting = storageService.getProductionRouting();
    const targetEnv = gearItemData.destination || (gearItemData.sendToKitchen ? 'COZINHA' : 'none');
    const isKitchen = targetEnv !== 'none';
    const updatedRouting = {
      ...currentRouting,
      sendToKitchen: {
        ...(currentRouting.sendToKitchen || {}),
        [targetId]: isKitchen
      },
      destinationEnv: {
        ...(currentRouting.destinationEnv || {}),
        [targetId]: targetEnv
      },
      showOnTV: {
        ...(currentRouting.showOnTV || {}),
        [targetId]: Boolean(gearItemData.showOnTV)
      }
    };
    storageService.saveProductionRouting(updatedRouting);
    setProductionRouting(updatedRouting);

    storageService.saveProducts(updated);
    setCategories(updated);
    setShowGearModal(false);
    showToast(`Configurações de "${cleanName}" salvas com sucesso!`, 'Item Atualizado');
  };

  // Excluir item a partir da engrenagem ⚙️ (Sem window.confirm nativo)
  const handleDeleteGearItem = () => {
    if (gearItemData.isVariation) {
      showToast('Itens base de pizza (Pedaço/Inteira) não podem ser excluídos.', 'Aviso', 'info');
      return;
    }

    const updated = categories.map(cat => {
      if (cat.id === gearItemData.categoryId) {
        return {
          ...cat,
          items: (cat.items || []).filter(it => it.id !== gearItemData.id)
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setConfirmDeleteGear(false);
    setShowGearModal(false);
    showToast(`Item "${gearItemData.name}" removido com sucesso!`, 'Item Excluído');
  };

  // Abrir modal de confirmação para excluir item diretamente pelo card
  const handleOpenDeleteItemConfirm = (item) => {
    if (item.isVariation) {
      showToast('Itens base de pizza (Pedaço/Inteira) são essenciais da cantina e não podem ser excluídos.', 'Aviso', 'info');
      return;
    }
    setDeleteItemConfirmModal({ isOpen: true, item });
  };

  // Confirmar exclusão de item do cardápio
  const handleConfirmDeleteItem = () => {
    const itemToDelete = deleteItemConfirmModal.item;
    if (!itemToDelete) return;

    if (itemToDelete.isVariation) {
      showToast('Itens base de pizza (Pedaço/Inteira) não podem ser excluídos.', 'Aviso', 'info');
      setDeleteItemConfirmModal({ isOpen: false, item: null });
      return;
    }

    const updated = categories.map(cat => {
      if (cat.id === itemToDelete.categoryId) {
        return {
          ...cat,
          items: (cat.items || []).filter(it => it.id !== itemToDelete.id)
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setDeleteItemConfirmModal({ isOpen: false, item: null });
    showToast(`Item "${itemToDelete.name}" excluído com sucesso!`, 'Item Removido');
  };

  // Adicionar novo item para venda
  const handleAddNewSaleItem = (e) => {
    if (e) e.preventDefault();
    const cleanName = newItemName.trim();
    if (!cleanName) {
      showToast(newItemCategory === 'pizza' ? 'O sabor da pizza é obrigatório!' : 'O nome do item é obrigatório!', 'Atenção', 'error');
      return;
    }

    let finalCatId = newItemCategory;
    let finalCatName = '';

    if (newItemCategory === '__NEW_CATEGORY__') {
      const cleanCatName = newCategoryName.trim();
      if (!cleanCatName) {
        showToast('Digite o nome da nova categoria (ex: Salada, Pão na Chapa)!', 'Atenção', 'error');
        return;
      }
      finalCatId = cleanCatName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');
      finalCatName = cleanCatName.toUpperCase();
    }

    const priceNum = parseCurrencyMask(newItemPrice);
    const cleanPrefix = newItemPrefix.trim() || (finalCatId === 'pizza' ? 'Pp-' : finalCatId === 'acai' ? 'A-' : finalCatId === 'batata' ? 'B-' : `${finalCatId.substring(0, 3).toUpperCase()}-`);
    const cleanDesc = newItemDesc.trim();

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      price: priceNum,
      prefix: cleanPrefix,
      description: cleanDesc,
      color: newItemColor || '#eab308'
    };

    let updated = [...categories];
    const catIndex = updated.findIndex(c => c.id === finalCatId);
    if (catIndex >= 0) {
      updated[catIndex] = {
        ...updated[catIndex],
        items: [...(updated[catIndex].items || []), newItem]
      };
    } else {
      updated.push({
        id: finalCatId,
        name: finalCatName || finalCatId.toUpperCase(),
        icon: 'Utensils',
        prefixDefault: cleanPrefix,
        items: [newItem],
        variations: []
      });
    }

    storageService.saveProducts(updated);
    setCategories(updated);

    // Salva roteamento de produção do novo item
    const targetDest = newItemDestination || (finalCatId === 'pizza' ? 'COZINHA' : 'none');
    const isKitchen = targetDest !== 'none';
    const currentRouting = storageService.getProductionRouting();
    const updatedRouting = {
      ...currentRouting,
      sendToKitchen: {
        ...(currentRouting.sendToKitchen || {}),
        [newItem.id]: isKitchen
      },
      destinationEnv: {
        ...(currentRouting.destinationEnv || {}),
        [newItem.id]: targetDest
      }
    };
    storageService.saveProductionRouting(updatedRouting);
    setProductionRouting(updatedRouting);

    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemPrice('0,00');
    setNewItemPrefix('Pp-');
    setNewItemCategory('pizza');
    setNewItemDestination('COZINHA');
    setNewCategoryName('');
    setNewItemDesc('');
    setNewItemColor('#eab308');
    showToast(`"${cleanName}" adicionado em "${finalCatName || finalCatId.toUpperCase()}" com sucesso!`, 'Item Cadastrado');
  };

  // Atualização direta da cor do item pelo cardápio
  const handleUpdateItemColor = (newColor, item) => {
    const updated = categories.map(cat => {
      if (item.isVariation && cat.id === 'pizza') {
        return {
          ...cat,
          variations: (cat.variations || []).map(v => v.id === item.variationId ? { ...v, color: newColor } : v)
        };
      }
      if (cat.id === item.categoryId) {
        return {
          ...cat,
          items: (cat.items || []).map(it => it.id === item.id ? { ...it, color: newColor } : it)
        };
      }
      return cat;
    });
    storageService.saveProducts(updated);
    setCategories(updated);
    showToast(`Cor de "${item.name}" atualizada!`, 'Cor Alterada', 'success');
  };

  // Atualização direta do prefixo no card (aceita maiúsculo e minúsculo)
  const handleUpdateItemPrefix = (newPrefix, item) => {
    if (item.isVariation) {
      if (item.variationId === 'pedaco') setPedacoPrefix(newPrefix);
      if (item.variationId === 'inteira') setInteiraPrefix(newPrefix);
    }

    setCategories(prev => {
      const updated = prev.map(cat => {
        if (item.isVariation && cat.id === 'pizza') {
          return {
            ...cat,
            variations: (cat.variations || []).map(v => v.id === item.variationId ? { ...v, prefix: newPrefix } : v)
          };
        }
        if (cat.id === item.categoryId) {
          return {
            ...cat,
            items: (cat.items || []).map(it => it.id === item.id ? { ...it, prefix: newPrefix } : it)
          };
        }
        return cat;
      });
      storageService.saveProducts(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Atualização direta do valor (preço) no card
  const handleUpdateItemPrice = (newPriceMasked, item) => {
    const formatted = formatCurrencyMask(newPriceMasked);
    const num = parseCurrencyMask(formatted);

    if (item.isVariation) {
      if (item.variationId === 'pedaco') setPedacoPrice(formatted);
      if (item.variationId === 'inteira') setInteiraPrice(formatted);
    }

    setCategories(prev => {
      const updated = prev.map(cat => {
        if (item.isVariation && cat.id === 'pizza') {
          return {
            ...cat,
            variations: (cat.variations || []).map(v => v.id === item.variationId ? { ...v, price: num } : v)
          };
        }
        if (cat.id === item.categoryId) {
          return {
            ...cat,
            items: (cat.items || []).map(it => it.id === item.id ? { ...it, price: num } : it)
          };
        }
        return cat;
      });
      storageService.saveProducts(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Salvar todos os itens e prefixos
  const handleSaveAllPrefixes = () => {
    storageService.saveProducts(categories);
    showToast('Itens cadastrados para venda e senhas salvos com sucesso!', 'Itens Salvos');
    if (onClose) onClose();
  };

  const handleSavePizzaPrices = () => {
    const pedVal = parsePrice(pedacoPrice);
    const intVal = parsePrice(inteiraPrice);
    const pPed = pedacoPrefix.trim() || 'Pp-';
    const pInt = inteiraPrefix.trim() || 'Pi-';

    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        return {
          ...cat,
          variations: [
            { id: 'pedaco', name: 'PEDAÇO', price: pedVal, prefix: pPed },
            { id: 'inteira', name: 'INTEIRA', price: intVal, prefix: pInt },
          ]
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Preços e Prefixos da Pizza atualizados!', 'Pizza Salva');
  };

  const handleAddPizzaFlavor = (e) => {
    e.preventDefault();
    if (!newPizzaFlavor.trim()) return;

    const flavorName = newPizzaFlavor.trim();
    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        const newItem = {
          id: 'p_' + Date.now(),
          name: flavorName,
          description: newPizzaDesc.trim() || 'Sabor especial',
          prefix: newPizzaPrefix.trim() || null
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewPizzaFlavor('');
    setNewPizzaDesc('');
    setNewPizzaPrefix('');
    showToast(`Sabor "${flavorName}" adicionado ao cardápio!`);
  };

  const handleRemovePizzaFlavor = (id) => {
    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        return { ...cat, items: cat.items.filter(item => item.id !== id) };
      }
      return cat;
    });
    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Sabor de pizza removido.');
  };

  const handleAddAcai = (e) => {
    e.preventDefault();
    if (!newAcaiName.trim() || !newAcaiPrice) return;

    const name = newAcaiName.trim();
    const price = parsePrice(newAcaiPrice);
    const pref = newAcaiPrefix.trim() || acaiPrefix.trim() || 'A-';

    const updated = categories.map(cat => {
      if (cat.id === 'acai') {
        const newItem = {
          id: 'acai_' + Date.now(),
          name,
          price,
          prefix: pref
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewAcaiName('');
    setNewAcaiPrice('');
    showToast(`Opção "${name}" adicionada ao Açaí!`);
  };

  const handleRemoveAcai = (id) => {
    const updated = categories.map(cat => {
      if (cat.id === 'acai') {
        return { ...cat, items: cat.items.filter(item => item.id !== id) };
      }
      return cat;
    });
    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Opção de Açaí removida.');
  };

  const handleAddBatata = (e) => {
    e.preventDefault();
    if (!newBatataName.trim() || !newBatataPrice) return;

    const name = newBatataName.trim();
    const price = parsePrice(newBatataPrice);
    const pref = newBatataPrefix.trim() || batataPrefix.trim() || 'B-';

    const updated = categories.map(cat => {
      if (cat.id === 'batata') {
        const newItem = {
          id: 'bat_' + Date.now(),
          name,
          price,
          prefix: pref
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewBatataName('');
    setNewBatataPrice('');
    showToast(`Opção "${name}" adicionada à Batata!`);
  };

  const handleRemoveBatata = (id) => {
    const updated = categories.map(cat => {
      if (cat.id === 'batata') {
        return { ...cat, items: cat.items.filter(item => item.id !== id) };
      }
      return cat;
    });
    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Opção de Batata removida.');
  };



  // --- AÇÕES DO FIREBASE ---
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    try {
      const ok = storageService.saveFirebaseConfig(firebaseConfig);
      if (ok) {
        setFirebaseStatus({ success: true, message: 'Firebase conectado com sucesso!' });
        showToast('Firebase conectado com sucesso!', 'Conexão Nuvem');
      } else {
        setFirebaseStatus({ success: false, message: 'Dados salvos, mas verifique se o Project ID e API Key estão corretos.' });
        showToast('Verifique se o Project ID e API Key estão corretos.', 'Atenção', 'warning');
      }
    } catch (err) {
      setFirebaseStatus({ success: false, message: err.message });
      showToast(err.message, 'Erro', 'error');
    }
  };

  // --- AÇÕES DO FECHAMENTO DE CAIXA E EVENTOS ---
  const handleCreateEvent = (e) => {
    e.preventDefault();
    const cleanName = newEventName.trim();
    if (!cleanName) {
      showToast('Digite o nome do evento!', 'Atenção', 'error');
      return;
    }
    const created = storageService.createEvent(cleanName, newEventDate);
    setCurrentEvent(created);
    setEventsList(storageService.getEventsList());
    setNewEventName('');
    setShowNewEventForm(false);
    showToast(`Evento "${cleanName}" criado e ativado com sucesso!`, 'Evento Ativo');
  };

  const handleSelectEvent = (eventId) => {
    const selected = eventsList.find(e => e.id === eventId);
    if (selected) {
      storageService.saveCurrentEvent(selected);
      setCurrentEvent(selected);
      showToast(`Evento ativo alterado para "${selected.name}"!`, 'Evento Ativo');
    }
  };

  // Abre o modal bonito de confirmação de exclusão
  const handleOpenCancelConfirm = (order) => {
    setCancelConfirmModal({
      isOpen: true,
      order
    });
  };

  // Executa a exclusão após o usuário clicar em SIM no modal bonito
  const handleConfirmCancelOrder = async () => {
    if (!cancelConfirmModal.order) return;
    const orderId = cancelConfirmModal.order.id;
    await storageService.updateOrderStatus(orderId, 'cancelado');
    setOrders(storageService.getLocalOrders());
    setCancelConfirmModal({ isOpen: false, order: null });
    showToast('Venda excluída do faturamento!', 'Venda Excluída', 'info');
  };

  const handleRestoreOrder = async (orderId) => {
    await storageService.updateOrderStatus(orderId, 'entregue');
    setOrders(storageService.getLocalOrders());
    showToast('Venda restaurada com sucesso ao faturamento!', 'Venda Restaurada');
  };

  // Filtro de data do Fechamento de Caixa
  // 'all' = Todos os pedidos do turno atual ativo (garante que vendas não sumam na virada da meia-noite!)
  const availableDates = Array.from(new Set(orders.map(o => {
    if (!o.createdAt) return '';
    return new Date(o.createdAt).toLocaleDateString('pt-BR');
  }))).filter(Boolean);

  const displayedOrders = orders.filter(o => {
    if (reportDateFilter === 'all') return true;
    return new Date(o.createdAt).toLocaleDateString('pt-BR') === reportDateFilter;
  });

  // Lógica de ordenação da tabela de fechamento de caixa
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDisplayedOrders = [...displayedOrders].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'orderNumber') {
      const numA = parseInt(String(a.orderNumber || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.orderNumber || '').replace(/\D/g, ''), 10) || 0;
      comparison = numA - numB;
      if (comparison === 0) {
        comparison = String(a.orderNumber || '').localeCompare(String(b.orderNumber || ''));
      }
    } else if (sortField === 'customerName') {
      comparison = String(a.customerName || '').localeCompare(String(b.customerName || ''), 'pt-BR', { sensitivity: 'base' });
    } else if (sortField === 'itemName') {
      const descA = a.fullDescription || a.itemName || '';
      const descB = b.fullDescription || b.itemName || '';
      comparison = descA.localeCompare(descB, 'pt-BR', { sensitivity: 'base' });
    } else if (sortField === 'quantity') {
      comparison = (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
    } else if (sortField === 'paymentMethod') {
      comparison = String(a.paymentMethod || '').localeCompare(String(b.paymentMethod || ''));
    } else if (sortField === 'totalPrice') {
      comparison = (Number(a.totalPrice) || 0) - (Number(b.totalPrice) || 0);
    } else if (sortField === 'createdAt') {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      comparison = timeA - timeB;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Exportar dados em CSV com BOM UTF-8 e delimitador ';' para abrir perfeitamente no Excel pt-BR
  const exportToCSV = () => {
    if (!sortedDisplayedOrders || sortedDisplayedOrders.length === 0) {
      showToast('Nenhum dado para exportar.', 'Aviso', 'info');
      return;
    }

    const headers = ['Comanda', 'Cliente', 'Item / Descrição', 'Quantidade', 'Forma de Pagamento', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Data / Hora', 'Status'];
    const rows = sortedDisplayedOrders.map(ord => {
      const isCancelled = ord.status === 'cancelado';
      const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('pt-BR') : '';
      return [
        `"${ord.orderNumber || ''}"`,
        `"${(ord.customerName || '').replace(/"/g, '""')}"`,
        `"${(ord.fullDescription || ord.itemName || '').replace(/"/g, '""')}"`,
        ord.quantity || 1,
        `"${ord.paymentMethod || ''}"`,
        (Number(ord.unitPrice) || 0).toFixed(2).replace('.', ','),
        (Number(ord.totalPrice) || 0).toFixed(2).replace('.', ','),
        `"${dateStr}"`,
        isCancelled ? '"CANCELADO / EXCLUÍDO"' : '"CONFIRMADO"'
      ].join(';');
    });

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateFile = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `fechamento_caixa_cantina_${dateFile}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Arquivo .CSV exportado com sucesso!', 'Exportação Concluída', 'success');
  };

  // Exportar dados em .XLS (formato compatível Excel com formatação)
  const exportToXLS = () => {
    if (!sortedDisplayedOrders || sortedDisplayedOrders.length === 0) {
      showToast('Nenhum dado para exportar.', 'Aviso', 'info');
      return;
    }

    const dateFile = new Date().toISOString().split('T')[0];
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #0f172a; color: #f59e0b; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; font-size: 12px; }
          td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 11px; }
          .cancelled { color: #dc2626; text-decoration: line-through; background-color: #fee2e2; }
          .currency { text-align: right; font-weight: bold; color: #047857; font-family: monospace; }
        </style>
      </head>
      <body>
        <h3>FECHAMENTO DE CAIXA - CANTINA</h3>
        <p><strong>Evento:</strong> ${currentEvent?.name || 'Cantina Geral'} &bull; <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Total Faturado:</strong> ${formatPrice(totalGeral, showCurrencySymbol)} &bull; <strong>Vendas Ativas:</strong> ${activeOrders.length}</p>
        <table>
          <thead>
            <tr>
              <th>Comanda</th>
              <th>Cliente</th>
              <th>Item / Descrição</th>
              <th>Qtde</th>
              <th>Pagamento</th>
              <th>Valor Unit. (R$)</th>
              <th>Total (R$)</th>
              <th>Data/Hora</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedDisplayedOrders.forEach(ord => {
      const isCancelled = ord.status === 'cancelado';
      const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('pt-BR') : '';
      tableHtml += `
        <tr class="${isCancelled ? 'cancelled' : ''}">
          <td style="font-weight: bold; color: #ea580c; font-family: monospace;">${ord.orderNumber || ''}</td>
          <td>${ord.customerName || ''}</td>
          <td>${ord.fullDescription || ord.itemName || ''}</td>
          <td style="text-align: center;">${ord.quantity || 1}</td>
          <td>${ord.paymentMethod || ''}</td>
          <td class="currency">${(Number(ord.unitPrice) || 0).toFixed(2).replace('.', ',')}</td>
          <td class="currency">${(Number(ord.totalPrice) || 0).toFixed(2).replace('.', ',')}</td>
          <td>${dateStr}</td>
          <td>${isCancelled ? 'CANCELADO' : 'CONFIRMADO'}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fechamento_caixa_cantina_${dateFile}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha .XLS exportada com sucesso!', 'Exportação Concluída', 'success');
  };

  // Vendas ativas (exclui vendas canceladas/excluídas do cálculo financeiro)
  const activeOrders = displayedOrders.filter(o => o.status !== 'cancelado');
  const totalGeral = activeOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalPix = activeOrders.filter(o => o.paymentMethod === 'PIX').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDinheiro = activeOrders.filter(o => o.paymentMethod === 'DINHEIRO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDebito = activeOrders.filter(o => o.paymentMethod === 'DEBITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalCredito = activeOrders.filter(o => o.paymentMethod === 'CREDITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const handleOpenResetModal = () => {
    setShowResetModal(true);
  };

  const handleConfirmResetTurno = async () => {
    setIsResetting(true);
    try {
      const snapshot = await storageService.archiveAndClearOrders();
      setOrders([]);
      setTurnoHistory(storageService.getTurnoHistory());
      setShowResetModal(false);
      showToast(
        `Turno encerrado! Cópia de ${snapshot.totalOrders} vendas arquivada com sucesso.`,
        'Turno Encerrado e Salvo',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao encerrar turno: ' + (err.message || 'Tente novamente'), 'Erro', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmClearQueue = async () => {
    try {
      await storageService.clearAllOrders();
      setOrders([]);
      setShowClearQueueModal(false);
      showToast('Fila de pedidos da Cozinha e Painel TV limpos com sucesso!', 'Fila e Cache Limpos', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao limpar fila: ' + (err.message || 'Tente novamente'), 'Erro', 'error');
    }
  };

  const handleConfirmDeleteHistory = async () => {
    setIsDeletingHistory(true);
    try {
      await storageService.clearTurnoHistory();
      setTurnoHistory([]);
      setShowDeleteHistoryModal(false);
      showToast('Todo o histórico de backups foi excluído com sucesso.', 'Histórico Excluído', 'success');
    } catch (err) {
      console.error('Erro ao excluir histórico:', err);
      showToast('Erro ao excluir histórico: ' + (err.message || 'Tente novamente'), 'Erro', 'error');
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const handleOpenConference = (hist) => {
    setSelectedTurnoForConference(hist);
  };

  const handleRequestReopenTurno = (hist) => {
    setReopenTurnoConfirmModal({ isOpen: true, turno: hist });
  };

  const handleConfirmReopenTurno = async () => {
    if (!reopenTurnoConfirmModal.turno) return;
    setIsReopeningTurno(true);
    try {
      const restored = await storageService.restoreTurnoAsActive(reopenTurnoConfirmModal.turno.id);
      setOrders(restored);
      setReopenTurnoConfirmModal({ isOpen: false, turno: null });
      setSelectedTurnoForConference(null);
      showToast(
        `Caixa reaberto com sucesso! ${restored.length} vendas deste turno foram restauradas.`,
        'Caixa Reaberto',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao reabrir caixa: ' + (err.message || 'Tente novamente'), 'Erro', 'error');
    } finally {
      setIsReopeningTurno(false);
    }
  };

  // Calcula agrupamento detalhado de produtos vendidos no turno para conferência aprofundada
  const getTurnoItemBreakdown = (ordersList = []) => {
    const itemMap = new Map();
    ordersList.forEach(order => {
      if (order.status === 'cancelado') return;
      const items = order.items && order.items.length > 0 
        ? order.items 
        : [{ 
            name: order.itemName || order.fullDescription || 'Item', 
            quantity: order.quantity || 1, 
            unitPrice: order.unitPrice || order.totalPrice || 0,
            category: order.category
          }];
      
      items.forEach(it => {
        const name = it.description || it.name || it.itemName || 'Item';
        const qty = Number(it.quantity) || 1;
        const unitP = Number(it.unitPrice) || 0;
        const total = unitP > 0 ? unitP * qty : (Number(order.totalPrice) || 0);
        
        if (itemMap.has(name)) {
          const prev = itemMap.get(name);
          itemMap.set(name, {
            ...prev,
            quantity: prev.quantity + qty,
            totalValue: prev.totalValue + total
          });
        } else {
          itemMap.set(name, {
            name,
            quantity: qty,
            unitPrice: unitP,
            totalValue: total,
            category: it.category || ''
          });
        }
      });
    });
    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  };

  const pizzaCat = categories.find(c => c.id === 'pizza');
  const acaiCat = categories.find(c => c.id === 'acai');
  const batataCat = categories.find(c => c.id === 'batata');

  // Coleta todos os itens cadastrados para venda (Pizza Pedaço/Inteira, Copos Açaí, Batatas e outros)
  const allSaleItems = [];

  // Pizza variações (Pedaço e Inteira)
  if (pizzaCat?.variations) {
    pizzaCat.variations.forEach(v => {
      allSaleItems.push({
        ...v,
        id: v.id,
        name: `Pizza ${v.name}`,
        categoryName: 'PIZZA',
        price: v.id === 'pedaco' ? parseCurrencyMask(pedacoPrice) : parseCurrencyMask(inteiraPrice),
        prefix: v.id === 'pedaco' ? pedacoPrefix : inteiraPrefix,
        categoryId: 'pizza',
        isVariation: true,
        variationId: v.id,
        color: v.color || '#eab308',
        image: v.image || null,
        icon2d: v.icon2d || null,
        description: v.id === 'pedaco' ? 'Fatia individual de pizza' : 'Pizza inteira 8 fatias'
      });
    });
  }

  // Pizza itens diretos cadastrados
  if (pizzaCat?.items) {
    pizzaCat.items.forEach(it => {
      allSaleItems.push({
        ...it,
        id: it.id,
        name: it.name,
        categoryName: 'PIZZA',
        price: it.price !== undefined ? it.price : 0,
        prefix: it.prefix || 'Pp-',
        categoryId: 'pizza',
        isVariation: false,
        color: it.color || '#eab308',
        image: it.image || null,
        icon2d: it.icon2d || null,
        description: it.description || 'Opção de pizza'
      });
    });
  }

  // Açaí itens
  if (acaiCat?.items) {
    acaiCat.items.forEach(it => {
      allSaleItems.push({
        ...it,
        id: it.id,
        name: it.name,
        categoryName: 'AÇAÍ',
        price: it.price,
        prefix: it.prefix || acaiPrefix || 'A-',
        categoryId: 'acai',
        isVariation: false,
        color: it.color || '#a855f7',
        image: it.image || null,
        icon2d: it.icon2d || null,
        description: it.description || 'Opção de açaí'
      });
    });
  }

  // Batata itens
  if (batataCat?.items) {
    batataCat.items.forEach(it => {
      allSaleItems.push({
        ...it,
        id: it.id,
        name: it.name,
        categoryName: 'BATATA FRITA',
        price: it.price,
        prefix: it.prefix || batataPrefix || 'B-',
        categoryId: 'batata',
        isVariation: false,
        color: it.color || '#f97316',
        image: it.image || null,
        icon2d: it.icon2d || null,
        description: it.description || 'Opção de batata frita'
      });
    });
  }

  // Outras categorias adicionais cadastradas
  categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id)).forEach(cat => {
    (cat.items || []).forEach(it => {
      allSaleItems.push({
        ...it,
        id: it.id,
        name: it.name,
        categoryName: (cat.name || cat.id).toUpperCase(),
        price: it.price,
        prefix: it.prefix || cat.prefixDefault || 'Ped-',
        categoryId: cat.id,
        isVariation: false,
        color: it.color || '#06b6d4',
        image: it.image || null,
        icon2d: it.icon2d || null,
        description: it.description || ''
      });
    });
  });

  const filteredSaleItems = selectedCategoryFilter === 'all'
    ? allSaleItems
    : allSaleItems.filter(item => item.categoryId === selectedCategoryFilter);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-3 pt-2 sm:pt-3 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer overflow-y-auto"
    >
      
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 w-[98vw] max-w-7xl h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans cursor-default my-0"
      >
        
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-slate-800/90 px-6 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              CONFIGURAÇÕES
            </h2>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reports');
                setShowNewEventForm(prev => !prev);
              }}
              className={`ml-5 px-3.5 py-1.5 font-black text-xs rounded-xl transition-all shadow flex items-center justify-center cursor-pointer ${
                showNewEventForm && activeTab === 'reports'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title="Cadastrar um novo evento para a cantina"
            >
              <span>Novo Evento</span>
            </button>
          </div>

          {/* HORA LOCAL NO CENTRO: RELÓGIO ANALÓGICO DESTACADO À ESQ (SEM FUNDO EXTERNO) + HORA DIGITAL (+40%) */}
          <div className="flex-1 flex justify-center items-center px-4">
            <div className="flex items-center gap-2.5 select-none">
              {/* RELÓGIO ANALÓGICO COM FUNDO BRANCO, TRAÇOS/PONTEIROS PRETOS E SEGUNDO VERMELHO */}
              <div className="shrink-0 drop-shadow-md hover:scale-105 transition-transform" title="Relógio analógico em tempo real">
                <AnalogClock size={32} />
              </div>

              {/* CAIXA HORA DIGITAL (FUNDO PRETO, FONTE BRANCA AUMENTADA EM 40%, SEÇÃO SEPARADA) */}
              <div className="bg-black text-white px-3.5 py-1 rounded-xl font-mono font-black text-base sm:text-lg tracking-widest border border-slate-800 shadow-inner flex items-center">
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* BOTÃO REMOTO DE TRAVA DE MONITORES E TABLETS (SEMPRE EXIBIDO, INCLUSIVE EM CONFIGS) */}
            <button
              type="button"
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
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Telas Travadas 🔒</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Travar Telas 🔓</span>
                </>
              )}
            </button>

            {/* BOTÃO SALVAR PRINCIPAL SEMPRE VISÍVEL: VERDE BRILHO SE HOUVER ALTERAÇÕES, CASO CONTRÁRIO ESMAECIDO */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges}
              className={`px-3.5 py-1.5 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md ${
                hasUnsavedChanges
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/50 ring-2 ring-emerald-300 animate-pulse cursor-pointer'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/60 opacity-40 cursor-not-allowed'
              }`}
              title={hasUnsavedChanges ? 'Há alterações não salvas! Clique para salvar tudo agora' : 'Todas as alterações já estão salvas'}
            >
              <Save className={`w-4 h-4 ${hasUnsavedChanges ? 'stroke-[2.5]' : ''}`} />
              <span>Salvar</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              )}
            </button>

            <button
              onClick={handleSafeClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2 shrink-0 overflow-x-auto">
          {/* 1. VENDAS */}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>VENDAS</span>
          </button>

          {/* 2. AMBIENTES */}
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'emails'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Ambientes</span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-400/30">
              {environments.length}
            </span>
          </button>

          {/* 3. COZINHA & TELAS */}
          <button
            onClick={() => setActiveTab('tv')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'tv'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Cozinha & Telas (Tempos)</span>
          </button>

          {/* 4. CONEXÕES */}
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Conexões</span>
          </button>

          {/* 5. FECHAMENTO CAIXA */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Fechamento Caixa</span>
          </button>

          {/* 6. HISTÓRICO */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Histórico</span>
            {turnoHistory.length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {turnoHistory.length}
              </span>
            )}
          </button>

          {/* 7. SISTEMA */}
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-slate-800 text-amber-400 border-amber-400 font-black'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>SISTEMA</span>
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${activeTab === 'history' || activeTab === 'reports' ? 'flex flex-col' : 'space-y-6'}`}>

          {/* =========================================================
              ABA: AMBIENTES DE TRABALHO & ACESSOS
             ========================================================= */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              
              {/* PAINEL 1: CADASTRO E GERENCIAMENTO DOS AMBIENTES (COMPACTO - REDUZIDO EM 60%) */}
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                      <Store className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Ambientes de Trabalho</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                        {environments.filter(e => e.id !== 'TENDA' && (e.name||'').toUpperCase() !== 'TENDA' && e.id !== 'QUADRA').length}
                      </span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEnvName('');
                      setNewEnvType('kitchen');
                      setNewEnvDesc('');
                      setShowAddEnvModal(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Novo Ambiente</span>
                  </button>
                </div>

                {/* GRID DOS AMBIENTES ESMAGADOS EM 4 COLUNAS NA MESMA LINHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {environments
                    .filter(env => {
                      const id = (env?.id || '').toUpperCase();
                      const name = (env?.name || '').toUpperCase();
                      const desc = (env?.description || '').toLowerCase();
                      return (
                        id !== 'TENDA' && 
                        name !== 'TENDA' && 
                        id !== 'QUADRA' && 
                        name !== 'QUADRA' && 
                        !id.includes('TENDA') &&
                        !(id === 'COZINHA_2' && desc.includes('fogões adicionais'))
                      );
                    })
                    .map((env) => {
                    const isKitchen = env.type === 'kitchen';
                    const isDisplay = env.type === 'display';
                    const typeLabel = isKitchen ? '👨‍🍳 COZINHA' : isDisplay ? '📺 TV' : '💻 CAIXA';
                    const typeBadgeColor = isKitchen 
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
                      : isDisplay 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                    const emailCount = emailRules[env.id]?.length || 0;

                    return (
                      <div 
                        key={env.id}
                        className="bg-slate-900 p-2.5 rounded-xl border border-slate-700/80 flex flex-col justify-between hover:border-amber-500/50 transition-colors shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${typeBadgeColor}`}>
                              {typeLabel}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditEnv(env)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors cursor-pointer"
                                title="Editar ambiente"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {!env.isSystem && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteEnvConfirm(env)}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded transition-colors cursor-pointer"
                                  title="Excluir ambiente"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="text-xs font-black text-white truncate" title={env.name}>
                            {env.name}
                          </h4>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {env.description || `Ambiente ${env.name}`}
                          </div>
                        </div>

                        <div className="pt-1.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            {emailCount > 0 ? `${emailCount} e-mail` : 'Livre'}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            Ativo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PAINEL 2: VINCULAÇÃO DE E-MAILS GOOGLE AOS AMBIENTES (COMPACTO - REDUZIDO EM 60%) */}
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="font-extrabold text-white text-xs sm:text-sm">Vincular E-mails aos Ambientes (Opcional)</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Direciona o operador automaticamente ao fazer login
                  </span>
                </div>

                {/* FORMULÁRIO DE CADASTRO COMPACTO EM 1 LINHA */}
                <form onSubmit={handleAddEmail} className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="w-full sm:w-1/3">
                    <select
                      value={selectedProfileForEmail}
                      onChange={(e) => setSelectedProfileForEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {environments.map((env) => (
                        <option key={env.id} value={env.id}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:flex-1">
                    <input
                      type="email"
                      required
                      placeholder="exemplo@gmail.com"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Vincular</span>
                  </button>
                </form>

                {/* LISTAGEM DOS E-MAILS EM CARDS COMPACTOS ESMAGADOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {environments.map((env) => {
                    const emails = emailRules[env.id] || [];
                    const isKitchen = env.type === 'kitchen';
                    const isDisplay = env.type === 'display';
                    const borderColor = isKitchen ? 'border-orange-500/40' : isDisplay ? 'border-emerald-500/40' : 'border-amber-500/40';
                    const textColor = isKitchen ? 'text-orange-400' : isDisplay ? 'text-emerald-400' : 'text-amber-400';
                    const IconComp = isKitchen ? UtensilsCrossed : isDisplay ? Tv : ShieldCheck;

                    return (
                      <div key={env.id} className={`bg-slate-900 p-2 rounded-xl border ${borderColor} flex flex-col justify-between gap-1.5 shadow-xs`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <div className={`flex items-center gap-1 font-black text-xs ${textColor} truncate`}>
                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{env.name || env.shortName}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1 rounded bg-slate-950 border border-slate-800 shrink-0 ${textColor}`}>
                            {emails.length}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {emails.length > 0 ? (
                            emails.map((email) => (
                              <div key={email} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center justify-between text-[10px]">
                                <span className="text-slate-200 truncate">{email}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmail(env.id, email)}
                                  className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer ml-1"
                                  title="Remover e-mail"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-500 italic py-0.5 truncate">
                              Acesso livre (todos)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              ABA 1: CARDÁPIO, SABORES E PREÇOS
             ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">

              {/* ========================================================
                  PAINEL DE ITENS CADASTRADOS PARA VENDA (LINHAS ATÉ A BORDA ESQ E DIR)
                 ======================================================== */}
              <div className="-mx-6 px-6 py-4 border-y border-amber-500/40 bg-slate-950/70 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Tag className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2 flex-wrap">
                        ITENS CADASTRADOS PARA VENDA
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                          {allSaleItems.length} itens
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const initCat = selectedCategoryFilter !== 'all' ? selectedCategoryFilter : 'pizza';
                        const matchedCat = categories.find(c => c.id === initCat);
                        const initPrefix = initCat === 'acai' ? (acaiPrefix || 'A-') : initCat === 'batata' ? (batataPrefix || 'B-') : initCat === 'pizza' ? 'Pp-' : (matchedCat?.prefixDefault || 'Ped-');
                        setNewItemCategory(initCat);
                        setNewItemPrefix(initPrefix);
                        setNewItemName('');
                        setNewItemPrice('0,00');
                        setNewItemDesc('');
                        setShowAddItemModal(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0"
                      title="Adicionar novo item para venda"
                    >
                      <span>+ Novo Item</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewCatNameInput('');
                        setNewCatPrefixInput('');
                        setShowAddCategoryModal(true);
                      }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-cyan-400/40"
                      title="Criar nova categoria de itens (ex: Salada, Pão na Chapa, Bebidas, Lanches)"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Nova Categoria</span>
                    </button>
                  </div>
                </div>

                {/* CATEGORIAS CADASTRADAS: FILTROS INTERATIVOS COM CHIPS MODERNOS */}
                <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                      <Filter className="w-3.5 h-3.5 text-amber-400" />
                      Filtrar:
                    </span>

                    {/* BOTÃO TODAS */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>TODAS</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-slate-950/30 text-slate-950 font-bold'
                          : 'bg-slate-900 text-amber-400 border border-slate-800'
                      }`}>
                        {allSaleItems.length}
                      </span>
                    </button>

                    {/* CATEGORIAS ESPECÍFICAS */}
                    {categories.map((c) => {
                      const isSystem = ['pizza', 'acai', 'batata'].includes(c.id);
                      const count = c.id === 'pizza' ? (c.variations?.length || 0) : (c.items?.length || 0);
                      const isSelected = selectedCategoryFilter === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCategoryFilter(c.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-slate-800 text-white border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                          }`}
                        >
                          <span className="uppercase text-[11px] font-black">{c.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {count}
                          </span>
                          {!isSystem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteCatConfirmModal({ isOpen: true, category: c });
                              }}
                              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer ml-0.5"
                              title={`Excluir categoria "${c.name}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedCategoryFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0"
                    >
                      Mostrar Todas ({allSaleItems.length})
                    </button>
                  )}
                </div>

                {/* GRID DOS ITENS CADASTRADOS PARA VENDA (4 POR LINHA, INTERVALO REDUZIDO EM 50%) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
                  {filteredSaleItems.map((item) => (
                    <div 
                      key={`${item.categoryId}_${item.id}`} 
                      className="bg-slate-900/95 hover:bg-slate-900 p-2 sm:p-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 space-y-1.5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between relative group"
                    >
                      {/* TOPO: NOME DO ITEM (EM CIMA DO ÍCONE, DESTACADO DE PONTA A PONTA) */}
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wide truncate flex-1" title={item.name}>
                          {item.name}
                        </h4>
                      </div>

                      {/* MEIO: ÍCONE DESCIDO + CATEGORIA/COZINHA/DESCRIÇÃO + BOTÕES VERTICAIS À DIREITA */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        {/* LADO ESQUERDO: ÍCONE DESCIDO + TEXTOS */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* ÍCONE 2D SEM FUNDO (DESCIDO ABAIXO DO NOME) */}
                          <div className="shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <ProductIcon2D item={item} category={{ id: item.categoryId }} className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md" />
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* LINHA 1: CATEGORIA (EM VERDE) + LOCALIZADOR RETIRAR EM (EM VERMELHO, SEM ÍCONE) */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span 
                                className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border font-mono inline-block truncate max-w-[75px] bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                                title={item.categoryName}
                              >
                                {item.categoryName}
                              </span>

                              {(() => {
                                const targetId = item.isVariation ? item.variationId : item.id;
                                const catId = item.categoryId;
                                const isToKitchen = productionRouting.sendToKitchen?.[targetId] !== undefined
                                  ? productionRouting.sendToKitchen[targetId]
                                  : (productionRouting.sendToKitchen?.[catId] !== undefined ? productionRouting.sendToKitchen[catId] : (catId === 'pizza'));
                                const currentDest = productionRouting.destinationEnv?.[targetId] !== undefined
                                  ? productionRouting.destinationEnv[targetId]
                                  : (productionRouting.destinationEnv?.[catId] !== undefined ? productionRouting.destinationEnv[catId] : (isToKitchen ? 'COZINHA' : 'none'));
                                const destEnvObj = environments.find(e => e.id === currentDest);
                                const destName = destEnvObj ? destEnvObj.name : (currentDest !== 'none' ? currentDest : 'Balcão');
                                const labelText = currentDest !== 'none' ? `Retirar em ${destName}` : 'Retirar no Balcão';
                                return (
                                  <span 
                                    className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border inline-flex items-center truncate max-w-[130px] ${
                                      currentDest !== 'none'
                                        ? 'bg-red-950/90 text-red-300 border-red-500/60'
                                        : 'bg-slate-900 text-slate-300 border-slate-700'
                                    }`}
                                    title={labelText}
                                  >
                                    <span className="truncate">{labelText}</span>
                                  </span>
                                );
                              })()}
                            </div>

                            {/* DESCRIÇÃO DO ITEM (INTEIRA, MEIA A MEIA, FATIA EM CASO DE PIZZA) */}
                            <p className="text-[8.5px] text-slate-400 truncate block mt-0.5">
                              {item.categoryId === 'pizza'
                                ? 'Inteira, meia a meia, fatia'
                                : (item.description || 'Disponível no caixa')}
                            </p>
                          </div>
                        </div>

                        {/* LADO DIREITO: BOTÕES DE AÇÃO VERTICAL (EDITAR, COR E EXCLUIR UM EMBAIXO DO OUTRO) */}
                        <div className="flex flex-col gap-0.5 items-center shrink-0 relative">
                          {/* 1. LÁPIS VERDE (EDITAR) */}
                          <button
                            type="button"
                            onClick={() => handleOpenGearModal(item)}
                            className="w-5.5 h-5.5 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 flex items-center justify-center transition-all cursor-pointer bg-slate-950 shadow-xs"
                            title="Editar nome, foto ou ícone deste item"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>

                          {/* 2. BOTÃO DE COR: BOLINHA COLORIDA */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorPickerItemId(colorPickerItemId === item.id ? null : item.id);
                              }}
                              className="w-5.5 h-5.5 rounded-md border border-slate-700 hover:border-slate-500 flex items-center justify-center transition-all cursor-pointer p-0.5 hover:scale-110 bg-slate-950 shadow-xs"
                              title="Alterar cor deste item"
                            >
                              <span 
                                className="w-3 h-3 rounded-full shadow-xs border border-white/40 block shrink-0" 
                                style={{ backgroundColor: item.color || '#eab308' }}
                              />
                            </button>

                            {/* POPOVER COM AS 24 CORES */}
                            {colorPickerItemId === item.id && (
                              <div 
                                className="absolute right-full mr-2 top-0 z-50 bg-slate-950/98 backdrop-blur-md border border-slate-700 rounded-2xl p-2.5 shadow-2xl w-60 animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-1">
                                  <span className="flex items-center gap-1">
                                    <Palette className="w-3 h-3 text-amber-400" />
                                    <span>Cor do Item</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setColorPickerItemId(null)}
                                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-6 gap-1.5">
                                  {ITEM_COLOR_PALETTE.map((col) => {
                                    const isSelected = (item.color || '#eab308').toLowerCase() === col.hex.toLowerCase();
                                    return (
                                      <button
                                        key={col.id}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateItemColor(col.hex, item);
                                          setColorPickerItemId(null);
                                        }}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                                          isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-115 hover:ring-1 hover:ring-white/60 opacity-90 hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: col.hex }}
                                        title={col.name}
                                      >
                                        {isSelected && (
                                          <Check className="w-3 h-3 text-white drop-shadow stroke-[3]" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. LIXEIRINHA (EXCLUIR) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteItemConfirm(item)}
                            className="w-5.5 h-5.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer bg-slate-950 shadow-xs"
                            title="Excluir item do cardápio"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* EMBAIXO: INPUTS ELEGANTES DE SENHA E VALOR NA MESMA LINHA (COMPACTADOS EM 30%) */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/80">
                        {/* SENHA */}
                        <div className="bg-slate-950/80 px-1.5 py-1 rounded-lg border border-slate-800 focus-within:border-amber-500/60 flex items-center justify-between gap-1 transition-colors">
                          <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider shrink-0 select-none">
                            Senha
                          </label>
                          <input
                            type="text"
                            value={item.prefix || ''}
                            onChange={(e) => handleUpdateItemPrefix(e.target.value, item)}
                            placeholder="Pp-"
                            className="w-14 sm:w-16 bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-xs font-mono font-black text-amber-300 outline-none focus:border-amber-400 text-center transition-colors"
                          />
                        </div>

                        {/* VALOR */}
                        <div className="bg-slate-950/80 px-1.5 py-1 rounded-lg border border-slate-800 focus-within:border-emerald-500/60 flex items-center justify-between gap-1.5 transition-colors">
                          <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider shrink-0 select-none">
                            Valor
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatCurrencyMask(item.price)}
                            onChange={(e) => handleUpdateItemPrice(e.target.value, item)}
                            placeholder="0,00"
                            className="w-14 sm:w-16 bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-xs font-mono font-black text-emerald-400 outline-none focus:border-emerald-400 text-right transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ESTADO VAZIO CASO NÃO HAJA ITENS NA CATEGORIA FILTRADA */}
                  {filteredSaleItems.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6">
                      <Tag className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-slate-300 text-sm font-bold">Nenhum item cadastrado nesta categoria.</p>
                      <p className="text-slate-500 text-xs mt-1">Clique abaixo para adicionar um item diretamente aqui.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemCategory(selectedCategoryFilter === 'all' ? 'pizza' : selectedCategoryFilter);
                          setShowAddItemModal(true);
                        }}
                        className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Item Nesta Categoria</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              ABA HISTÓRICO: TURNOS ENCERRADOS, AUDITORIA E COMANDAS
             ========================================================= */}
          {activeTab === 'history' && (
            <div className="flex flex-col h-full min-h-0 gap-3 pb-1">
              {/* SEÇÃO 1: HISTÓRICO E AUDITORIA DE TODAS AS VENDAS DE HOJE */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 flex flex-col flex-1 min-h-0 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5 shrink-0">
                  <h4 className="font-extrabold text-white text-base tracking-wide shrink-0">
                    Histórico
                  </h4>

                  {/* CARDS TOTALIZADORES NO CABEÇALHO AO LADO DE HISTÓRICO */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total Geral</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono leading-tight mt-0.5">{formatPrice(totalGeral, showCurrencySymbol)}</div>
                      <div className="text-[8px] text-slate-500 leading-none">{activeOrders.length} ativas</div>
                    </div>
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-emerald-400 uppercase leading-none">PIX</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalPix, showCurrencySymbol)}</div>
                    </div>
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-teal-400 uppercase leading-none">Dinheiro</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalDinheiro, showCurrencySymbol)}</div>
                    </div>
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-blue-400 uppercase leading-none">Cartões</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalDebito + totalCredito, showCurrencySymbol)}</div>
                    </div>
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                      <div className="text-[9px] font-bold text-rose-400 uppercase leading-none">Excluídas</div>
                      <div className="text-xs sm:text-sm font-black text-rose-400 font-mono leading-tight mt-0.5">{orders.length - activeOrders.length}</div>
                    </div>
                  </div>
                </div>

                {/* TABELA COMPLETA COM STATUS, EXCLUÍDOS EM ESMAECIDO E RESTAURAR (COMPACTA E EXPANDIDA) */}
                <div className="border border-slate-700/80 rounded-xl overflow-hidden mt-1 flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[9px] tracking-wider z-10 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2">Comanda</th>
                          <th className="py-1.5 px-2">Cliente</th>
                          <th className="py-1.5 px-2">Item</th>
                          <th className="py-1.5 px-2">Qtde</th>
                          <th className="py-1.5 px-2">Pagamento</th>
                          <th className="py-1.5 px-2 text-right">Valor</th>
                          <th className="py-1.5 px-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-slate-500 italic">
                              Nenhuma venda registrada no turno atual.
                            </td>
                          </tr>
                        ) : (
                          orders.map((ord) => {
                            const isCancelled = ord.status === 'cancelado';
                            return (
                              <tr 
                                key={ord.id} 
                                className={`transition-colors ${
                                  isCancelled 
                                    ? 'opacity-40 bg-slate-950/80 text-slate-500 line-through select-none' 
                                    : 'hover:bg-slate-800/50'
                                }`}
                              >
                                <td className="py-1 px-2 font-mono font-bold text-orange-400 whitespace-nowrap">{ord.orderNumber}</td>
                                <td className="py-1 px-2 font-semibold text-white">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                                      {ord.customerName}
                                    </span>
                                    {isCancelled && (
                                      <span className="no-underline text-[8px] font-black uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800 px-1 py-0.2 rounded shadow-sm inline-block">
                                        EXCLUÍDO
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 px-2 text-slate-300 truncate max-w-[180px]">{ord.fullDescription || ord.itemName}</td>
                                <td className="py-1 px-2 whitespace-nowrap">{ord.quantity}x</td>
                                <td className="py-1 px-2 whitespace-nowrap text-slate-400">{ord.paymentMethod}</td>
                                <td className={`py-1 px-2 text-right font-bold whitespace-nowrap ${isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                  {formatPrice(ord.totalPrice, showCurrencySymbol)}
                                </td>
                                <td className="py-1 px-2 text-center no-underline whitespace-nowrap">
                                  {isCancelled ? (
                                    <button
                                      onClick={() => handleRestoreOrder(ord.id)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] rounded border border-slate-700 inline-flex items-center gap-0.5 shadow-sm no-underline cursor-pointer"
                                      title="Restaurar venda de volta ao faturamento do caixa"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" /> Restaurar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenCancelConfirm(ord)}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors inline-flex items-center cursor-pointer"
                                      title="Excluir venda do faturamento (permanece no histórico esmaecida)"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SEÇÃO: BACKUPS (EM 2 COLUNAS ESPREMIDAS NO RODAPÉ) */}
              <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700 space-y-2 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-tight">Backups</h4>
                      <p className="text-[10px] text-slate-400">
                        Cópias salvas e turnos arquivados com faturamento e vendas anteriores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-700">
                      {turnoHistory.length} backup(s)
                    </span>
                    <button
                      type="button"
                      disabled={turnoHistory.length === 0}
                      onClick={() => setShowDeleteHistoryModal(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
                        turnoHistory.length === 0
                          ? 'bg-slate-800/40 text-slate-600 border border-slate-700/50 cursor-not-allowed opacity-50'
                          : 'bg-rose-600/25 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 shadow-sm hover:scale-[1.02]'
                      }`}
                      title="Excluir permanentemente todo o histórico de backups arquivados"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir Histórico
                    </button>
                    <button
                      onClick={handleOpenResetModal}
                      className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm hover:scale-[1.02] cursor-pointer"
                      title="Salvar cópia de backup e iniciar novo turno limpo"
                    >
                      <RotateCcw className="w-3 h-3" /> Zerar / Fechar Turno
                    </button>
                  </div>
                </div>

                {turnoHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs italic bg-slate-900/30 rounded-xl border border-slate-800">
                    Nenhum backup arquivado ainda. Ao clicar em &quot;Zerar / Fechar Turno&quot;, uma cópia completa de segurança será preservada aqui.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
                    {turnoHistory.map((bkp, idx) => {
                      const bkpDate = new Date(bkp.timestamp || bkp.date || bkp.archivedAt || Date.now());
                      const dateFormatted = bkpDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
                      const timeFormatted = bkpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const rev = bkp.totalRevenue || bkp.stats?.totalRevenue || 0;
                      const count = bkp.orders?.length || bkp.ordersCount || bkp.totalOrders || 0;

                      return (
                        <div
                          key={bkp.id || idx}
                          className="p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl flex flex-col justify-between gap-1.5 transition-all shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold font-mono text-[10px]">
                                #{turnoHistory.length - idx}
                              </span>
                              <span className="text-white text-[11px] font-bold truncate leading-tight" title={bkp.label || bkp.name}>
                                {bkp.label || bkp.name || `Backup (${bkpDate.toLocaleDateString()})`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenConference(bkp)}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-md text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                                title="Conferir vendas deste turno"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" /> Conferir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestReopenTurno(bkp)}
                                className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-md text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                                title="Reabrir este turno"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Reabrir
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2 py-0.5 rounded-lg border border-slate-800/80">
                            <span className="text-slate-400 flex items-center gap-1">
                              📅 {dateFormatted} {timeFormatted}
                            </span>
                            <span className="text-emerald-400 font-black font-mono">
                              {formatPrice(rev, showCurrencySymbol)}
                            </span>
                            <span className="text-slate-300 font-bold bg-slate-900 px-1 py-0.2 rounded border border-slate-800 text-[9px]">
                              {count} ped.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =========================================================
              ABA 2: CONEXÃO COM O FIREBASE ONLINE
             ========================================================= */}
          {activeTab === 'firebase' && (
            <div className="space-y-6">
              
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Cloud className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-white text-base">Conexão Firebase da Minha Conta</h3>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-amber-300">Status da Sincronização em Tempo Real (Realtime):</p>
                  <p className="text-slate-400">
                    • <strong>Hospedagem Web:</strong> <span className="text-white font-mono">cantina-express-32161.web.app</span><br/>
                    • <strong>Banco Cloud Firestore:</strong> <span className="text-emerald-400 font-mono font-bold">{firebaseConfig.projectId || 'carga-patrimonio'}</span> (Ativo com WebSocket contínuo e Heartbeat de 2s)
                  </p>
                </div>

                {firebaseStatus && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    firebaseStatus.success 
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50' 
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                  }`}>
                    {firebaseStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{firebaseStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveFirebase} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300">API Key *</label>
                      <input
                        type="text"
                        required
                        value={firebaseConfig.apiKey}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300">Project ID *</label>
                      <input
                        type="text"
                        required
                        value={firebaseConfig.projectId}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300">Auth Domain</label>
                      <input
                        type="text"
                        value={firebaseConfig.authDomain}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300">Storage Bucket</label>
                      <input
                        type="text"
                        value={firebaseConfig.storageBucket}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar e Atualizar Firebase</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* =========================================================
              ABA 3: FECHAMENTO DE CAIXA E RESUMO DO DIA
             ========================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-3 flex flex-col flex-1 min-h-0">
              
              {/* FORMULÁRIO CORTINA: CADASTRAR NOVO EVENTO DA CANTINA (PRINT 2) */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden shrink-0 ${
                  showNewEventForm
                    ? 'max-h-80 opacity-100 scale-100 mb-2'
                    : 'max-h-0 opacity-0 scale-95 pointer-events-none mb-0'
                }`}
              >
                <form onSubmit={handleCreateEvent} className="bg-slate-950/95 p-4 rounded-xl border border-amber-500/50 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <CalendarPlus className="w-4 h-4" />
                      <span>Cadastrar Novo Evento da Cantina</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewEventForm(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg text-xs cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-7">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Nome do Evento:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Festa Junina 2026, Festival da Pizza, Encontro Especial..."
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Data do Evento:
                      </label>
                      <input
                        type="date"
                        required
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* SEÇÃO: RESUMO DE VENDAS */}
              <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700 flex flex-col flex-1 min-h-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-700/80 pb-2.5 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-base shrink-0">
                      Resumo de vendas
                    </h3>
                    {availableDates.length > 0 && (
                      <select
                        value={reportDateFilter}
                        onChange={(e) => setReportDateFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                        title="Filtrar resumo por data"
                      >
                        <option value="all">Turno Ativo Completo ({orders.length} vendas)</option>
                        {availableDates.map(d => (
                          <option key={d} value={d}>
                            Data: {d} ({orders.filter(o => new Date(o.createdAt).toLocaleDateString('pt-BR') === d).length} vendas)
                          </option>
                        ))}
                      </select>
                    )}
                    {eventsList.length > 1 && (
                      <select
                        value={currentEvent?.id || ''}
                        onChange={(e) => handleSelectEvent(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                        title="Alternar entre eventos cadastrados"
                      >
                        {eventsList.map(evt => (
                          <option key={evt.id} value={evt.id}>
                            Evento: {evt.name} ({evt.date || 'Hoje'})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* BOTÕES DE EXPORTAÇÃO XLS E CSV */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={exportToXLS}
                        className="px-2.5 py-1 bg-emerald-700/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/50 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Exportar planilha completa em Excel (.XLS)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Exportar XLS</span>
                      </button>
                      <button
                        type="button"
                        onClick={exportToCSV}
                        className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-600 text-slate-200 hover:text-white rounded-xl border border-slate-600 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Exportar dados em formato (.CSV)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* CARDS COM TOTALIZADORES NA FRENTE DO TÍTULO */}
                  <div className="flex items-center gap-2 flex-wrap flex-1 justify-start lg:justify-center">
                    <div className="bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                      <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total Geral</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono leading-tight mt-0.5">{formatPrice(totalGeral, showCurrencySymbol)}</div>
                      <div className="text-[8px] text-slate-500 leading-none">
                        {activeOrders.length} ativas
                        {displayedOrders.length - activeOrders.length > 0 && (
                          <span className="text-rose-400 font-bold ml-1">
                            ({displayedOrders.length - activeOrders.length} excl.)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                      <div className="text-[9px] font-bold text-emerald-400 uppercase leading-none">PIX</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalPix, showCurrencySymbol)}</div>
                    </div>

                    <div className="bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                      <div className="text-[9px] font-bold text-teal-400 uppercase leading-none">Dinheiro</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalDinheiro, showCurrencySymbol)}</div>
                    </div>

                    <div className="bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                      <div className="text-[9px] font-bold text-blue-400 uppercase leading-none">Débito</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalDebito, showCurrencySymbol)}</div>
                    </div>

                    <div className="bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
                      <div className="text-[9px] font-bold text-indigo-400 uppercase leading-none">Crédito</div>
                      <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight mt-0.5">{formatPrice(totalCredito, showCurrencySymbol)}</div>
                    </div>
                  </div>

                  {/* BOTÃO APENAS ÍCONE ZERAR */}
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/40 transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95 shrink-0"
                    title="Zerar / Fechar Turno"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* TABELA DE PEDIDOS COMPACTA E EXPANDIDA ATÉ A BASE DO MODAL */}
                <div className="border border-slate-700/80 rounded-xl overflow-hidden mt-2 flex-1 flex flex-col min-h-0 bg-slate-950/40">
                  <div className="overflow-y-auto flex-1 min-h-[350px]">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[9px] tracking-wider z-10 shadow-sm border-b border-slate-800">
                        <tr>
                          {/* COLUNA DATA/HORA */}
                          <th 
                            onClick={() => handleSort('createdAt')}
                            className="py-1 px-2 cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                            title="Clique para ordenar por data/hora"
                          >
                            <div className="flex items-center gap-1">
                              <span>Data / Hora</span>
                              <span className={`text-[10px] ${sortField === 'createdAt' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'createdAt' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA COMANDA */}
                          <th 
                            onClick={() => handleSort('orderNumber')}
                            className="py-1 px-2 cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                            title="Clique para ordenar por comanda"
                          >
                            <div className="flex items-center gap-1">
                              <span>Comanda</span>
                              <span className={`text-[10px] ${sortField === 'orderNumber' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'orderNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA CLIENTE */}
                          <th 
                            onClick={() => handleSort('customerName')}
                            className="py-1 px-2 cursor-pointer hover:text-white transition-colors group select-none"
                            title="Clique para ordenar por cliente"
                          >
                            <div className="flex items-center gap-1">
                              <span>Cliente</span>
                              <span className={`text-[10px] ${sortField === 'customerName' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'customerName' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA ITEM */}
                          <th 
                            onClick={() => handleSort('itemName')}
                            className="py-1 px-2 cursor-pointer hover:text-white transition-colors group select-none"
                            title="Clique para ordenar por item"
                          >
                            <div className="flex items-center gap-1">
                              <span>Item</span>
                              <span className={`text-[10px] ${sortField === 'itemName' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'itemName' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA QTDE */}
                          <th 
                            onClick={() => handleSort('quantity')}
                            className="py-1 px-2 text-center cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                            title="Clique para ordenar por quantidade"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Qtde</span>
                              <span className={`text-[10px] ${sortField === 'quantity' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'quantity' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA PAGAMENTO */}
                          <th 
                            onClick={() => handleSort('paymentMethod')}
                            className="py-1 px-2 cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                            title="Clique para ordenar por forma de pagamento"
                          >
                            <div className="flex items-center gap-1">
                              <span>Pagamento</span>
                              <span className={`text-[10px] ${sortField === 'paymentMethod' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'paymentMethod' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA VALOR */}
                          <th 
                            onClick={() => handleSort('totalPrice')}
                            className="py-1 px-2 text-right cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                            title="Clique para ordenar por valor"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>Valor</span>
                              <span className={`text-[10px] ${sortField === 'totalPrice' ? 'text-amber-400 font-black' : 'text-slate-600 group-hover:text-amber-400'}`}>
                                {sortField === 'totalPrice' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                              </span>
                            </div>
                          </th>

                          {/* COLUNA AÇÕES */}
                          <th className="py-1 px-2 text-center whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 text-[11px]">
                        {sortedDisplayedOrders.map((ord) => {
                          const isCancelled = ord.status === 'cancelado';
                          const d = ord.createdAt ? new Date(ord.createdAt) : null;
                          const dayStr = d ? String(d.getDate()).padStart(2, '0') : '--';
                          const monthStr = d ? d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase() : '---';
                          const timeStr = d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';

                          return (
                            <tr 
                              key={ord.id} 
                              className={`transition-colors ${
                                isCancelled 
                                  ? 'opacity-40 bg-slate-950/80 text-slate-500 line-through select-none' 
                                  : 'hover:bg-slate-800/50'
                              }`}
                            >
                              {/* DATA / HORA */}
                              <td className="py-0.5 px-2 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                <span className="text-slate-300 font-semibold">{dayStr}-{monthStr}</span>
                                <span className="mx-1 text-slate-600">•</span>
                                <span className="text-amber-300/90">{timeStr}</span>
                              </td>

                              <td className="py-0.5 px-2 font-mono font-bold text-orange-400 whitespace-nowrap">{ord.orderNumber}</td>
                              <td className="py-0.5 px-2 font-bold text-white">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                                    {ord.customerName}
                                  </span>
                                  {isCancelled && (
                                    <span className="no-underline text-[8px] font-black uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800 px-1 py-0.2 rounded shadow-sm inline-block">
                                      EXCLUÍDO
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-0.5 px-2">
                                {ord.items && ord.items.length > 1 ? (
                                  <div className="space-y-0.5 py-0.5">
                                    {ord.items.map((it, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                                        <span className="font-mono font-black text-orange-400 bg-orange-950/60 border border-orange-500/30 px-1 py-0.2 rounded text-[9px]">
                                          {String(it.quantity || 1).padStart(2, '0')}x
                                        </span>
                                        <span className="font-medium">{it.description}</span>
                                        {it.unitPrice > 0 && (
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            ({formatPrice(it.unitPrice, showCurrencySymbol)})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span>{ord.fullDescription || ord.itemName}</span>
                                )}
                              </td>
                              <td className="py-0.5 px-2 text-center font-bold text-amber-300 whitespace-nowrap">
                                {ord.items && ord.items.length > 1 
                                  ? `${ord.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)} itens`
                                  : `${ord.quantity}x`
                                }
                              </td>
                              <td className="py-0.5 px-2 whitespace-nowrap text-slate-400">{ord.paymentMethod}</td>
                              <td className={`py-0.5 px-2 text-right font-bold whitespace-nowrap ${isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                {formatPrice(ord.totalPrice, showCurrencySymbol)}
                              </td>
                              <td className="py-0.5 px-2 text-center no-underline whitespace-nowrap">
                                {isCancelled ? (
                                  <button
                                    onClick={() => handleRestoreOrder(ord.id)}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] rounded-md border border-slate-700 inline-flex items-center gap-0.5 shadow-sm no-underline cursor-pointer"
                                    title="Restaurar venda de volta ao faturamento do caixa"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Restaurar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenCancelConfirm(ord)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Excluir venda do faturamento (permanece no histórico esmaecida)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {sortedDisplayedOrders.length === 0 && (
                          <tr>
                            <td colSpan="8" className="p-6 text-center text-slate-500 text-xs italic">
                              Nenhuma venda encontrada para o período selecionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =========================================================
              ABA 4: TELAS & SOM (TV/COZINHA) - DESTINO DE PRODUÇÃO
             ========================================================= */}
          {activeTab === 'tv' && (
            <div className="space-y-6">

              {/* SEÇÃO 0: TEMPO INTELIGENTE E CORES DOS PEDIDOS NA COZINHA (COMPACTO - REDUZIDO EM 70%) */}
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700 space-y-2">
                {/* CABEÇALHO COMPACTO EM 1 LINHA */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-2 truncate">
                      <span>Tempos e Cores dos Pedidos (Cozinha)</span>
                      <span className="text-[9px] bg-emerald-400/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-400/30 hidden md:inline">
                        5 Cores
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400 hidden xl:inline truncate">
                      • Verde/Azul (no prazo), Amarelo (alerta 1), Laranja (atrasado), Vermelho (muito atrasado)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetOrderTimeLimits}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Restaura os tempos padrão (3m, 6m, 10m, 15m)"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Padrão</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveOrderTimeLimits}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Salvar Tempos</span>
                    </button>
                  </div>
                </div>

                {/* 5 ESTÁGIOS ESMAGADOS NA MESMA LINHA (ALTURA REDUZIDA EM 70%) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-1.5">
                  {/* 1. VERDE: NORMAL */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border-l-4 border-l-emerald-500 border border-slate-700/80 flex items-center justify-between gap-1 shadow-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 truncate">Normal</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">0 a {orderTimeLimits.greenLimit || 1}m</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold">Até</span>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={orderTimeLimits.greenLimit}
                        onChange={(e) => handleUpdateOrderTimeLimits('greenLimit', e.target.value)}
                        onBlur={handleBlurOrderTimeLimits}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-400 text-center outline-none focus:border-emerald-400"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">m</span>
                    </div>
                  </div>

                  {/* 2. AZUL: NO PRAZO */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border-l-4 border-l-sky-500 border border-slate-700/80 flex items-center justify-between gap-1 shadow-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 truncate">No Prazo</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{orderTimeLimits.greenLimit || 1} a {orderTimeLimits.blueLimit || 2}m</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold">Até</span>
                      <input
                        type="number"
                        min={Number(orderTimeLimits.greenLimit) + 1}
                        max="180"
                        value={orderTimeLimits.blueLimit}
                        onChange={(e) => handleUpdateOrderTimeLimits('blueLimit', e.target.value)}
                        onBlur={handleBlurOrderTimeLimits}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-sky-400 text-center outline-none focus:border-sky-400"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">m</span>
                    </div>
                  </div>

                  {/* 3. AMARELO: ALERTA 1 */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border-l-4 border-l-amber-400 border border-slate-700/80 flex items-center justify-between gap-1 shadow-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 truncate">Alerta 1</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{orderTimeLimits.blueLimit || 2} a {orderTimeLimits.yellowLimit || 3}m</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold">Até</span>
                      <input
                        type="number"
                        min={Number(orderTimeLimits.blueLimit) + 1}
                        max="240"
                        value={orderTimeLimits.yellowLimit}
                        onChange={(e) => handleUpdateOrderTimeLimits('yellowLimit', e.target.value)}
                        onBlur={handleBlurOrderTimeLimits}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-amber-300 text-center outline-none focus:border-amber-400"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">m</span>
                    </div>
                  </div>

                  {/* 4. LARANJA: ATRASADO */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border-l-4 border-l-orange-500 border border-slate-700/80 flex items-center justify-between gap-1 shadow-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 truncate">Atrasado</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{orderTimeLimits.yellowLimit || 3} a {orderTimeLimits.orangeLimit || 4}m</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold">Até</span>
                      <input
                        type="number"
                        min={Number(orderTimeLimits.yellowLimit) + 1}
                        max="360"
                        value={orderTimeLimits.orangeLimit}
                        onChange={(e) => handleUpdateOrderTimeLimits('orangeLimit', e.target.value)}
                        onBlur={handleBlurOrderTimeLimits}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-orange-400 text-center outline-none focus:border-orange-400"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">m</span>
                    </div>
                  </div>

                  {/* 5. VERMELHO: MUITO ATRASADO */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border-l-4 border-l-rose-500 border border-slate-700/80 flex items-center justify-between gap-1 shadow-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 truncate">Crítico</span>
                      </div>
                      <div className="text-[9px] text-rose-400 font-mono truncate">&gt; {orderTimeLimits.orangeLimit}m</div>
                    </div>
                    <div className="text-[10px] font-mono font-black text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded shrink-0">
                      &gt; {orderTimeLimits.orangeLimit} min
                    </div>
                  </div>
                </div>

                {/* BARRA VISUAL DA LINHA DO TEMPO COMPACTA */}
                <div className="h-3 rounded overflow-hidden flex text-[8px] font-black font-mono text-slate-950 border border-slate-800">
                  <div 
                    className="bg-emerald-500 flex items-center justify-center transition-all" 
                    style={{ width: `${Math.max(10, ((Number(orderTimeLimits.greenLimit) || 1) / ((Number(orderTimeLimits.orangeLimit) || 15) * 1.25)) * 100)}%` }} 
                    title={`Normal: 0 a ${orderTimeLimits.greenLimit} min`}
                  >
                    0-{orderTimeLimits.greenLimit}m
                  </div>
                  <div 
                    className="bg-sky-400 flex items-center justify-center transition-all" 
                    style={{ width: `${Math.max(10, ((Math.max(1, (Number(orderTimeLimits.blueLimit) || 2) - (Number(orderTimeLimits.greenLimit) || 1))) / ((Number(orderTimeLimits.orangeLimit) || 15) * 1.25)) * 100)}%` }} 
                    title={`No prazo: ${orderTimeLimits.greenLimit} a ${orderTimeLimits.blueLimit} min`}
                  >
                    {orderTimeLimits.blueLimit}m
                  </div>
                  <div 
                    className="bg-amber-400 flex items-center justify-center transition-all" 
                    style={{ width: `${Math.max(10, ((Math.max(1, (Number(orderTimeLimits.yellowLimit) || 3) - (Number(orderTimeLimits.blueLimit) || 2))) / ((Number(orderTimeLimits.orangeLimit) || 15) * 1.25)) * 100)}%` }} 
                    title={`Alerta 1: ${orderTimeLimits.blueLimit} a ${orderTimeLimits.yellowLimit} min`}
                  >
                    {orderTimeLimits.yellowLimit}m
                  </div>
                  <div 
                    className="bg-orange-500 flex items-center justify-center transition-all" 
                    style={{ width: `${Math.max(10, ((Math.max(1, (Number(orderTimeLimits.orangeLimit) || 4) - (Number(orderTimeLimits.yellowLimit) || 3))) / ((Number(orderTimeLimits.orangeLimit) || 15) * 1.25)) * 100)}%` }} 
                    title={`Atrasado: ${orderTimeLimits.yellowLimit} a ${orderTimeLimits.orangeLimit} min`}
                  >
                    {orderTimeLimits.orangeLimit}m
                  </div>
                  <div 
                    className="bg-rose-600 flex items-center justify-center flex-1 text-white animate-pulse" 
                    title={`Muito Atrasado: acima de ${orderTimeLimits.orangeLimit} min`}
                  >
                    &gt;{orderTimeLimits.orangeLimit}m
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: TELAS DO AMBIENTE - DESTINO DE PREPARO E CORTE RÁPIDO */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                      <UtensilsCrossed className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-white text-base flex items-center gap-2 flex-wrap">
                        Telas do Ambiente — Destino de Preparo & Exibição
                        <span className="text-[10px] bg-orange-400/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-400/30">
                          {allSaleItems.length} itens configuráveis
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Defina o ambiente de preparo de cada item. O público recebe apenas os avisos de itens prontos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetProductionRouting}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                    title="Restaura o padrão de envio"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>

                {/* CABEÇALHO DAS COLUNAS: ITEM | ENVIAR PARA O PREPARO | OCULTAR / EXIBIR */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <div className="md:col-span-5">ITEM</div>
                  <div className="md:col-span-4">ENVIAR PARA O PREPARO</div>
                  <div className="md:col-span-3 text-right">OCULTAR / EXIBIR (CORTE RÁPIDO)</div>
                </div>

                {/* LISTAGEM DOS ITENS EM 3 COLUNAS */}
                <div className="space-y-2 pt-1">
                  {allSaleItems.map((item) => {
                    const targetId = item.isVariation ? item.variationId : item.id;
                    const catId = item.categoryId;

                    const isToKitchen = productionRouting.sendToKitchen?.[targetId] !== undefined
                      ? productionRouting.sendToKitchen[targetId]
                      : (productionRouting.sendToKitchen?.[catId] !== undefined ? productionRouting.sendToKitchen[catId] : (catId === 'pizza'));

                    const currentDest = productionRouting.destinationEnv?.[targetId] !== undefined
                      ? productionRouting.destinationEnv[targetId]
                      : (productionRouting.destinationEnv?.[catId] !== undefined 
                          ? productionRouting.destinationEnv[catId] 
                          : (isToKitchen ? 'COZINHA' : 'none'));

                    const isToTV = productionRouting.showOnTV?.[targetId] !== undefined
                      ? productionRouting.showOnTV[targetId]
                      : (productionRouting.showOnTV?.[catId] !== undefined ? productionRouting.showOnTV[catId] : (catId === 'pizza'));

                    // Filtra apenas ambientes de preparo (Cozinhas, fogões)
                    // NUNCA exibe telas de público, admin ou itens legados no destino de preparo
                    const kitchenEnvironments = environments.filter(env => 
                      env.type === 'kitchen' && 
                      env.id !== 'PUBLICO' && 
                      env.id !== 'ADMIN' && 
                      env.id !== 'TENDA' && 
                      !env.id.includes('TENDA') && 
                      (env.name || '').toUpperCase() !== 'TENDA' &&
                      !(env.id === 'COZINHA_2' && (env.description || '').toLowerCase().includes('fogões adicionais'))
                    );

                    const destEnvObj = environments.find(e => e.id === currentDest);
                    const destDisplayName = destEnvObj ? destEnvObj.name : (currentDest !== 'none' ? currentDest : 'Balcão (Sem Preparo)');

                    return (
                      <div 
                        key={`routing_${catId}_${targetId}`}
                        className="bg-slate-900 p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                      >
                        {/* COLUNA 1: ITEM (Ícone + Nome, SEM A SENHA) */}
                        <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                          <span className={`p-2 rounded-xl border text-xs shrink-0 ${
                            catId === 'pizza' 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                              : catId === 'acai'
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                : catId === 'batata'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {catId === 'pizza' ? <Pizza className="w-4 h-4" /> : catId === 'acai' ? <IceCream className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
                          </span>

                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-white truncate">{item.name}</h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {currentDest !== 'none' 
                                ? `Preparo em: ${destDisplayName}` 
                                : 'Venda direta no caixa (sem envio para preparo)'}
                            </p>
                          </div>
                        </div>

                        {/* COLUNA 2: ENVIAR PARA O PREPARO (Listbox com Ambientes de Cozinha/Preparo, SEM PÚBLICO) */}
                        <div className="md:col-span-4 min-w-0">
                          <div className="relative">
                            <select
                              value={currentDest}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__NEW_ENV__') {
                                  setShowAddEnvModal(true);
                                } else {
                                  handleChangeItemDestination(targetId, val, item.name);
                                }
                              }}
                              className={`w-full h-10 px-3 pr-8 rounded-xl text-xs font-black transition-all border-2 outline-none cursor-pointer appearance-none shadow-md truncate ${
                                currentDest !== 'none'
                                  ? 'bg-blue-950 text-blue-100 border-blue-500 hover:border-blue-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/50'
                                  : 'bg-slate-950 text-emerald-300 border-emerald-500/80 hover:border-emerald-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/50'
                              }`}
                              title="Selecione o ambiente de preparo para onde a comanda deste item será enviada"
                            >
                              <optgroup label="🍳 Fogões / Telas de Preparo" className="bg-slate-950 text-slate-300 font-bold">
                                {kitchenEnvironments.map((env) => (
                                  <option key={env.id} value={env.id} className="bg-slate-900 text-white font-bold py-1.5">
                                    🍳 {env.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="📦 Direto sem Cozinha" className="bg-slate-950 text-emerald-400 font-bold">
                                <option value="none" className="bg-slate-900 text-emerald-300 font-bold py-1.5">
                                  📦 Balcão (Sem Preparo / Entrega Direta)
                                </option>
                              </optgroup>
                              <optgroup label="✨ Novo" className="bg-slate-950 text-amber-400 font-bold">
                                <option value="__NEW_ENV__" className="bg-slate-900 text-amber-300 font-black py-1.5">
                                  ✨ + Cadastrar Novo Espaço...
                                </option>
                              </optgroup>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          </div>
                        </div>

                        {/* COLUNA 3: OCULTAR / EXIBIR (CORTE RÁPIDO: CLICOU NÃO MOSTRA) */}
                        <div className="md:col-span-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleToggleItemTV(targetId, !isToTV)}
                            className={`w-full md:w-auto min-w-[125px] h-9 px-3.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                              isToTV
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                                : 'bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border-rose-800/60 hover:border-rose-600'
                            }`}
                            title="Corte rápido: Clicou não mostra no painel TV"
                          >
                            {isToTV ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>✓ Exibindo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>✕ Oculto</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 2: CONFIGURAÇÃO DE EXIBIÇÃO E SOM DO PAINEL TV (TODAS AS OPÇÕES NA MESMA LINHA) */}
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
                  <div className="flex items-center gap-2">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="font-extrabold text-white text-xs">Configuração Geral de Exibição do Painel TV</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Defina exibição, som e comportamento da TV e Cozinha</span>
                </div>

                {/* 5 OPÇÕES ESMAGADAS TODAS NA MESMA LINHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-1.5">
                  
                  {/* CARD 1: ALARME SOM TV */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-1 hover:border-slate-600 transition-colors">
                    <div className="min-w-0 pr-0.5">
                      <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Som TV</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate" title="Ding-dong na TV quando o pedido estiver pronto">
                        Ding-dong pronto
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTVSound}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                        tvSettings.soundEnabled
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tvSettings.soundEnabled ? '✓ Ativado' : '✕ Desat.'}
                    </button>
                  </div>

                  {/* CARD 2: EXIBIR PEDIDOS ENTREGUES */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-1 hover:border-slate-600 transition-colors">
                    <div className="min-w-0 pr-0.5">
                      <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">Entregues</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate" title="Mostra os últimos pedidos entregues na TV">
                        Lista entregues
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTVDelivered}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                        tvSettings.showDelivered
                          ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tvSettings.showDelivered ? '✓ Exibir' : '✕ Ocultar'}
                    </button>
                  </div>

                  {/* CARD 3: TELA CHEIA AUTOMÁTICA */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-1 hover:border-slate-600 transition-colors">
                    <div className="min-w-0 pr-0.5">
                      <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">Tela Cheia</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate" title="Abre a TV automaticamente em fullscreen">
                        Fullscreen TV
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTVFullscreen}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                        tvSettings.autoFullscreen
                          ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tvSettings.autoFullscreen ? '✓ Ativado' : '✕ Desat.'}
                    </button>
                  </div>

                  {/* CARD 4: AVISOS SONOROS NA COZINHA */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-1 hover:border-slate-600 transition-colors">
                    <div className="min-w-0 pr-0.5">
                      <div className="font-bold text-[11px] text-white truncate flex items-center gap-1">
                        <BellRing className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Cozinha</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate" title="Toca o alarme sonoro na cozinha a cada novo pedido">
                        Aviso pedido
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleKitchenSound}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${
                        kitchenSettings.soundEnabled
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {kitchenSettings.soundEnabled ? '✓ Ativado' : '✕ Desat.'}
                    </button>
                  </div>

                  {/* CARD 5: LIMPEZA DE FILA E CACHE */}
                  <div className="bg-slate-900 px-2 py-1.5 rounded-xl border border-rose-500/40 flex items-center justify-between gap-1 hover:border-rose-500/70 transition-colors">
                    <div className="min-w-0 pr-0.5">
                      <div className="font-bold text-[11px] text-rose-300 flex items-center gap-1 truncate">
                        <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">Limpar Fila</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate" title="Apaga pedidos da fila ativa e limpa o cache local">
                        Zera Cozinha/TV
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClearQueueModal(true)}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 border border-rose-400/50"
                      title="Apaga os pedidos da fila ativa e limpa o cache"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Limpar</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              ABA 7: SISTEMA & PERSONALIZAÇÃO COMPLETA
              - Fundo da Seção dos Cards (Caixa)
              - Efeitos & Animações
              - Tempos do Sistema & Chamada de Senha
              - Distância entre Cards nas Cozinhas
              - Fontes & Tipografia
             ========================================================= */}
          {activeTab === 'system' && (
            <div className="space-y-3">

              {/* PAINEL: SÍMBOLO DA MOEDA (R$) NOS VALORES */}
              <div className="bg-slate-900/95 rounded-xl border border-slate-800 p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm tracking-wide flex items-center gap-2">
                      EXIBIÇÃO DE MOEDA (R$)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Exibir o prefixo 'R$' antes de todos os valores no sistema (cards de venda, comandas, cozinha, telão e relatórios).
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500/60 px-3 py-1.5 rounded-lg transition-all select-none shadow-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={showCurrencySymbol}
                    onChange={(e) => handleToggleCurrencySymbol(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-600 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-xs font-black text-white">Exibir R$ nos valores</span>
                </label>
              </div>

              {/* PAINEL 1: FUNDO DA SEÇÃO DOS CARDS (CAIXA) - NOVO LAYOUT 2 COLUNAS */}
              <div className="bg-slate-900/95 rounded-2xl border border-amber-500/30 p-3.5 sm:p-4 shadow-xl space-y-3.5 relative overflow-hidden">
                {/* CABEÇALHO: TÍTULO, BADGE E RESTAURAR */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                      <Palette className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h3 className="font-black text-white text-sm tracking-wide truncate">
                        FUNDO DA SEÇÃO DOS CARDS (CAIXA)
                      </h3>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                        {BACKGROUND_PRESETS.find(p => p.id === bgSettings.theme)?.name || (bgSettings.theme === 'upload' ? 'Upload Próprio' : 'Personalizado')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CORPO PRINCIPAL EM 2 COLUNAS: À ESQUERDA (TIPOS + EFEITOS), À DIREITA (PREVIEW REDUZIDO EM LARGURA E MAIS ALTO) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                  {/* COLUNA ESQUERDA (Lg: col-span-8): SEÇÃO DE TIPOS DE FUNDOS E CONTROLES DE EFEITOS */}
                  <div className="lg:col-span-8 space-y-3">
                    {/* 1. SEÇÃO DE TIPOS DE FUNDO */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tipos de Texturas e Fundos</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {BACKGROUND_PRESETS.length} opções disponíveis
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {BACKGROUND_PRESETS.map((preset) => {
                          const isSelected = bgSettings.theme === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                handleUpdateBgSetting('theme', preset.id);
                                if (preset.id === 'upload' && !bgSettings.customImage && bgUploadInputRef.current) {
                                  bgUploadInputRef.current.click();
                                }
                              }}
                              className={`py-1.5 px-2 rounded-xl border text-left transition-all cursor-pointer relative flex items-center justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                                  : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                              title={preset.desc}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full border border-white/30 shadow-xs shrink-0" 
                                  style={{ backgroundColor: preset.previewColor }}
                                />
                                <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                  {preset.name}
                                </span>
                              </div>
                              {isSelected && (
                                <Check className="w-3 h-3 text-amber-400 stroke-[3] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* UPLOAD DE FUNDO PERSONALIZADO */}
                    <input 
                      type="file" 
                      ref={bgUploadInputRef} 
                      onChange={handleUploadBgFile} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {bgSettings.theme === 'upload' && (
                      <div className="py-2 px-3 bg-cyan-950/40 rounded-xl border border-cyan-500/40 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg shrink-0">
                            <Upload className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {bgSettings.customImage ? 'Fundo Personalizado Carregado' : 'Nenhuma imagem enviada'}
                            </p>
                            <p className="text-[10px] text-cyan-300/80">
                              Aceita PNG, JPG, WebP ou SVG (máx. 8MB)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => bgUploadInputRef.current?.click()}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{bgSettings.customImage ? 'Trocar Imagem' : 'Fazer Upload'}</span>
                          </button>
                          {bgSettings.customImage && (
                            <button
                              type="button"
                              onClick={handleRemoveUploadedBg}
                              className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg text-xs font-bold transition-all border border-red-800/60 cursor-pointer"
                              title="Remover imagem enviada"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* COR PERSONALIZADA (SOMENTE SE TEMA FOR 'CUSTOM') */}
                    {bgSettings.theme === 'custom' && (
                      <div className="py-1.5 px-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">Cor de Fundo:</span>
                        <input
                          type="color"
                          value={bgSettings.customColor || '#eace9a'}
                          onChange={(e) => handleUpdateBgSetting('customColor', e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          value={bgSettings.customColor || '#eace9a'}
                          onChange={(e) => handleUpdateBgSetting('customColor', e.target.value)}
                          className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-center"
                        />
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                          {['#eace9a', '#f5f5f4', '#d6d3d1', '#78716c', '#44403c', '#1c1917', '#0f172a', '#1e293b', '#262626', '#172554', '#7c2d12', '#9a3412'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleUpdateBgSetting('customColor', c)}
                              className="w-5 h-5 rounded-md border border-white/20 hover:scale-115 transition-transform cursor-pointer shrink-0"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. CONTROLES DE EFEITOS (OPACIDADE, PROFUNDIDADE, TAMANHO E CLARIDADE) OS 4 NA MESMA LINHA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 pt-0.5">
                      {/* EFEITO 1: TEXTURA (OPACIDADE) */}
                      <div className="bg-slate-950/70 py-1.5 px-2 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-amber-400" />
                            <span className="truncate">Opacidade</span>
                          </label>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {bgSettings.textureOpacity ?? 100}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 shrink-0">0%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={bgSettings.textureOpacity ?? 100}
                            onChange={(e) => handleUpdateBgSetting('textureOpacity', Number(e.target.value))}
                            className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                          />
                          <span className="text-[9px] text-slate-500 shrink-0">100%</span>
                        </div>
                      </div>

                      {/* EFEITO 2: RELEVO */}
                      <div className="bg-slate-950/70 py-1.5 px-2 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-cyan-400" />
                            <span className="truncate">Relevo</span>
                          </label>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {bgSettings.textureDepth ?? 100}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 shrink-0">30%</span>
                          <input
                            type="range"
                            min="30"
                            max="200"
                            step="5"
                            value={bgSettings.textureDepth ?? 100}
                            onChange={(e) => handleUpdateBgSetting('textureDepth', Number(e.target.value))}
                            className="flex-1 accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                          />
                          <span className="text-[9px] text-slate-500 shrink-0">200%</span>
                        </div>
                      </div>

                      {/* EFEITO 3: TAMANHO */}
                      <div className="bg-slate-950/70 py-1.5 px-2 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center gap-1">
                            <Maximize2 className="w-3 h-3 text-emerald-400" />
                            <span className="truncate">Tamanho</span>
                          </label>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {bgSettings.textureSize ?? 100}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 shrink-0">2%</span>
                          <input
                            type="range"
                            min="2"
                            max="250"
                            step="1"
                            value={bgSettings.textureSize ?? 100}
                            onChange={(e) => handleUpdateBgSetting('textureSize', Number(e.target.value))}
                            className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                          />
                          <span className="text-[9px] text-slate-500 shrink-0">250%</span>
                        </div>
                      </div>

                      {/* EFEITO 4: BRILHO */}
                      <div className="bg-slate-950/70 py-1.5 px-2 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-400" />
                            <span className="truncate">Brilho</span>
                          </label>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {bgSettings.darkness ?? 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 shrink-0">0%</span>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            step="5"
                            value={bgSettings.darkness ?? 0}
                            onChange={(e) => handleUpdateBgSetting('darkness', Number(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-500">80%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DIREITA (Lg: col-span-4): PREVIEW DOS CARDS REDUZIDO EM LARGURA E COM ALTURA AUMENTADA */}
                  <div className="lg:col-span-4 flex flex-col">
                    <div 
                      className="relative rounded-2xl overflow-hidden border border-slate-700/80 p-3 flex-1 min-h-[175px] flex flex-col justify-between shadow-2xl transition-all"
                      style={{ backgroundColor: previewBgStyle.bgColor }}
                    >
                      {/* Camada de Textura com Opacidade, Tamanho e Profundidade */}
                      {previewBgStyle.bgImage && (
                        <div 
                          aria-hidden="true"
                          className="absolute inset-0 pointer-events-none transition-all duration-200"
                          style={{
                            backgroundImage: previewBgStyle.bgImage,
                            backgroundRepeat: previewBgStyle.bgRepeat || 'repeat',
                            backgroundPosition: previewBgStyle.bgPosition || '0 0',
                            backgroundSize: previewBgStyle.bgSize || '460px auto',
                            opacity: (bgSettings.textureOpacity ?? 100) / 100,
                            filter: `contrast(${(bgSettings.textureDepth ?? 100)}%) saturate(${Math.min(140, Math.max(60, (bgSettings.textureDepth ?? 100)))}%)`,
                            transform: 'translateZ(0)'
                          }}
                        />
                      )}

                      {/* Camada de Escurecimento */}
                      {Number(bgSettings.darkness || 0) > 0 && (
                        <div 
                          aria-hidden="true"
                          className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-200"
                          style={{ opacity: (Number(bgSettings.darkness || 0)) / 100 }}
                        />
                      )}

                      {/* Topo do Preview */}
                      <div className="relative z-10 flex items-center justify-between gap-1.5 border-b border-black/20 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Prévia no Caixa</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Ao Vivo
                        </span>
                      </div>

                      {/* Cards de Exemplo no Preview */}
                      <div className="relative z-10 py-2.5 space-y-2">
                        <div className="rounded-xl bg-slate-900/95 border border-emerald-400/80 p-2 shadow-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Pizza className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-xs font-black text-white truncate">Pizza Calabresa</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">R$ 15,00</span>
                        </div>

                        <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 p-2 shadow-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IceCream className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-xs font-black text-white truncate">Açaí 300ml</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">R$ 12,00</span>
                        </div>
                      </div>

                      {/* Rodapé do Preview com Métricas */}
                      <div className="relative z-10 text-[9px] font-mono text-slate-200 drop-shadow flex items-center justify-between gap-1 pt-1.5 border-t border-black/20">
                        <span>Tam: {bgSettings.textureSize ?? 100}%</span>
                        <span>Prof: {bgSettings.textureDepth ?? 100}%</span>
                        <span>Opac: {bgSettings.textureOpacity ?? 100}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAINEL: TEMPOS DO SISTEMA (SENHA E LIMITES ESMAGADOS NA MESMA LINHA) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                {/* COLUNA 1 (5 cols): TEMPO EXIBIÇÃO DA SENHA */}
                <div className="lg:col-span-5 bg-slate-900/95 rounded-xl border border-slate-800 p-3 shadow-xl space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                        <Tv className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">
                        TEMPO EXIBIÇÃO DA SENHA
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      {systemSettings.callPasswordDuration || 6}s
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="3"
                      max="20"
                      step="1"
                      value={systemSettings.callPasswordDuration || 6}
                      onChange={(e) => handleUpdateSystemSetting('callPasswordDuration', Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {[
                        { label: '3s', val: 3 },
                        { label: '6s (Pad)', val: 6 },
                        { label: '8s', val: 8 },
                        { label: '10s', val: 10 },
                        { label: '15s', val: 15 }
                      ].map(btn => (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => handleUpdateSystemSetting('callPasswordDuration', btn.val)}
                          className={`py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                            (systemSettings.callPasswordDuration || 6) === btn.val
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                              : 'bg-slate-950/80 hover:bg-slate-850 text-slate-300 border-slate-800'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUNA 2 (7 cols): LIMITES DE TEMPO E CORES DOS PEDIDOS NA COZINHA */}
                <div className="lg:col-span-7 bg-slate-900/95 rounded-xl border border-slate-800 p-3 shadow-xl space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">
                        LIMITES DE TEMPO (COZINHA)
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetOrderTimeLimits}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Restaurar tempos padrão"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
                        <span>Padrão</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {/* VERDE */}
                    <div className="bg-slate-950 p-1.5 rounded-lg border-l-4 border-l-emerald-500 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-emerald-400 block truncate">Normal</span>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400">Até</span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={orderTimeLimits.greenLimit}
                          onChange={(e) => handleUpdateOrderTimeLimits('greenLimit', e.target.value)}
                          onBlur={handleBlurOrderTimeLimits}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] font-mono font-bold text-emerald-400 text-center outline-none focus:border-emerald-400"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">m</span>
                      </div>
                    </div>

                    {/* AZUL */}
                    <div className="bg-slate-950 p-1.5 rounded-lg border-l-4 border-l-sky-500 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-sky-400 block truncate">No Prazo</span>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400">Até</span>
                        <input
                          type="number"
                          min={Number(orderTimeLimits.greenLimit) + 1}
                          max="180"
                          value={orderTimeLimits.blueLimit}
                          onChange={(e) => handleUpdateOrderTimeLimits('blueLimit', e.target.value)}
                          onBlur={handleBlurOrderTimeLimits}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] font-mono font-bold text-sky-400 text-center outline-none focus:border-sky-400"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">m</span>
                      </div>
                    </div>

                    {/* AMARELO */}
                    <div className="bg-slate-950 p-1.5 rounded-lg border-l-4 border-l-yellow-500 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-yellow-400 block truncate">Alerta</span>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400">Até</span>
                        <input
                          type="number"
                          min={Number(orderTimeLimits.blueLimit) + 1}
                          max="240"
                          value={orderTimeLimits.yellowLimit}
                          onChange={(e) => handleUpdateOrderTimeLimits('yellowLimit', e.target.value)}
                          onBlur={handleBlurOrderTimeLimits}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] font-mono font-bold text-yellow-400 text-center outline-none focus:border-yellow-400"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">m</span>
                      </div>
                    </div>

                    {/* LARANJA */}
                    <div className="bg-slate-950 p-1.5 rounded-lg border-l-4 border-l-orange-500 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-orange-400 block truncate">Atrasado</span>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400">Até</span>
                        <input
                          type="number"
                          min={Number(orderTimeLimits.yellowLimit) + 1}
                          max="360"
                          value={orderTimeLimits.orangeLimit}
                          onChange={(e) => handleUpdateOrderTimeLimits('orangeLimit', e.target.value)}
                          onBlur={handleBlurOrderTimeLimits}
                          className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] font-mono font-bold text-orange-400 text-center outline-none focus:border-orange-400"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">m</span>
                      </div>
                    </div>

                    {/* VERMELHO */}
                    <div className="bg-slate-950 p-1.5 rounded-lg border-l-4 border-l-rose-500 border border-slate-800 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-rose-400 block truncate">Crítico</span>
                      <div className="text-[10px] font-mono font-bold text-rose-300 pt-1 text-center">
                        &gt; {orderTimeLimits.orangeLimit}m
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAINEL: ALTURA DOS CARDS & DISTÂNCIA ENTRE OS CARDS (2 COLUNAS - TUDO SLIDE) */}
              <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-3.5 relative overflow-hidden">
                {/* CABEÇALHO */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-black text-white text-xs sm:text-sm tracking-wide truncate">
                        ALTURA & DISTÂNCIA ENTRE OS CARDS
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Controle deslizante em tempo real para a altura de cada comanda e o espaçamento vertical entre elas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CONTROLES UNIFICADOS: ALTURA E DISTÂNCIA DOS CARDS (SEM SEÇÕES SEPARADAS) */}
                <div className="space-y-2">
                  
                  {/* 1. COZINHA */}
                  <div className="bg-slate-950/70 hover:bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3 transition-colors">
                    <div className="flex items-center gap-2 md:w-48 shrink-0">
                      <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                        <ChefHat className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                        Cozinha (Comandas)
                      </span>
                    </div>

                    {/* SLIDE ALTURA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Altura:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">36</span>
                      <input
                        type="range"
                        min="36"
                        max="110"
                        step="2"
                        value={resolveHeightPx(systemSettings.kitchenCardHeight, 52)}
                        onInput={(e) => handleUpdateSystemSetting('kitchenCardHeight', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('kitchenCardHeight', Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">110</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 min-w-[50px] text-center">
                        {resolveHeightPx(systemSettings.kitchenCardHeight, 52)}px
                      </span>
                    </div>

                    {/* SLIDE DISTÂNCIA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Distância:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">2</span>
                      <input
                        type="range"
                        min="2"
                        max="32"
                        step="1"
                        value={resolveSpacingPx(systemSettings.kitchenCardSpacing, 6)}
                        onInput={(e) => handleUpdateSystemSetting('kitchenCardSpacing', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('kitchenCardSpacing', Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">32</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 min-w-[46px] text-center">
                        {resolveSpacingPx(systemSettings.kitchenCardSpacing, 6)}px
                      </span>
                    </div>
                  </div>

                  {/* 2. TELÃO / TV */}
                  <div className="bg-slate-950/70 hover:bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3 transition-colors">
                    <div className="flex items-center gap-2 md:w-48 shrink-0">
                      <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                        <Tv className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                        Telão / TV (Público)
                      </span>
                    </div>

                    {/* SLIDE ALTURA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Altura:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">44</span>
                      <input
                        type="range"
                        min="44"
                        max="130"
                        step="2"
                        value={resolveHeightPx(systemSettings.displayCardHeight, 64)}
                        onInput={(e) => handleUpdateSystemSetting('displayCardHeight', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('displayCardHeight', Number(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">130</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 min-w-[50px] text-center">
                        {resolveHeightPx(systemSettings.displayCardHeight, 64)}px
                      </span>
                    </div>

                    {/* SLIDE DISTÂNCIA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Distância:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">2</span>
                      <input
                        type="range"
                        min="2"
                        max="32"
                        step="1"
                        value={resolveSpacingPx(systemSettings.displayCardSpacing, 6)}
                        onInput={(e) => handleUpdateSystemSetting('displayCardSpacing', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('displayCardSpacing', Number(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">32</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 min-w-[46px] text-center">
                        {resolveSpacingPx(systemSettings.displayCardSpacing, 6)}px
                      </span>
                    </div>
                  </div>

                  {/* 3. CAIXA */}
                  <div className="bg-slate-950/70 hover:bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3 transition-colors">
                    <div className="flex items-center gap-2 md:w-48 shrink-0">
                      <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                        <Monitor className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                        Caixa (Rodapé)
                      </span>
                    </div>

                    {/* SLIDE ALTURA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Altura:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">28</span>
                      <input
                        type="range"
                        min="28"
                        max="90"
                        step="2"
                        value={resolveHeightPx(systemSettings.cashierCardHeight, 42)}
                        onInput={(e) => handleUpdateSystemSetting('cashierCardHeight', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('cashierCardHeight', Number(e.target.value))}
                        className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">90</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 min-w-[50px] text-center">
                        {resolveHeightPx(systemSettings.cashierCardHeight, 42)}px
                      </span>
                    </div>

                    {/* SLIDE DISTÂNCIA */}
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Distância:</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">2</span>
                      <input
                        type="range"
                        min="2"
                        max="32"
                        step="1"
                        value={resolveSpacingPx(systemSettings.cashierCardSpacing, 6)}
                        onInput={(e) => handleUpdateSystemSetting('cashierCardSpacing', Number(e.target.value))}
                        onChange={(e) => handleUpdateSystemSetting('cashierCardSpacing', Number(e.target.value))}
                        className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer min-w-0"
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">32</span>
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 min-w-[46px] text-center">
                        {resolveSpacingPx(systemSettings.cashierCardSpacing, 6)}px
                      </span>
                    </div>
                  </div>

                  {/* PRÉ-VISUALIZAÇÃO DINÂMICA EM TEMPO REAL DOS CARDS */}
                  <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/90">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                          Pré-Visualização em Tempo Real (Atualização Imediata)
                        </span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Sincronizando Nuvem e Telas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* Prévia Cozinha */}
                      <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-amber-400 mb-1.5 flex items-center justify-between">
                          <span>Cozinha</span>
                          <span className="font-mono text-[9px] text-slate-400">{resolveHeightPx(systemSettings.kitchenCardHeight, 52)}px | gap {resolveSpacingPx(systemSettings.kitchenCardSpacing, 6)}px</span>
                        </div>
                        <div className="flex flex-col" style={{ gap: `${resolveSpacingPx(systemSettings.kitchenCardSpacing, 6)}px` }}>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.kitchenCardHeight, 52)}px` }}
                            className="bg-slate-950/90 border-y border-l-[4px] border-r-0 border-slate-700 border-l-amber-400 rounded-l-md px-2 py-1 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono font-black text-amber-400">#0042</span>
                            <span className="font-bold text-slate-200 truncate mx-1">1x Pastel de Carne</span>
                            <span className="text-[9px] font-mono text-emerald-400">03:12</span>
                          </div>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.kitchenCardHeight, 52)}px` }}
                            className="bg-slate-950/90 border-y border-l-[4px] border-r-0 border-slate-700 border-l-blue-400 rounded-l-md px-2 py-1 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono font-black text-amber-400">#0043</span>
                            <span className="font-bold text-slate-200 truncate mx-1">2x Açaí 300ml</span>
                            <span className="text-[9px] font-mono text-blue-400">01:45</span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia Telão */}
                      <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-indigo-400 mb-1.5 flex items-center justify-between">
                          <span>Telão / TV</span>
                          <span className="font-mono text-[9px] text-slate-400">{resolveHeightPx(systemSettings.displayCardHeight, 64)}px | gap {resolveSpacingPx(systemSettings.displayCardSpacing, 6)}px</span>
                        </div>
                        <div className="flex flex-col" style={{ gap: `${resolveSpacingPx(systemSettings.displayCardSpacing, 6)}px` }}>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.displayCardHeight, 64)}px` }}
                            className="bg-slate-950 border-y border-amber-500/50 px-2 py-1 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono font-black text-amber-400 text-sm">#0042</span>
                            <span className="font-bold text-white uppercase text-[11px] truncate">MARIA</span>
                            <span className="text-[10px] text-amber-300 font-bold">PREPARO</span>
                          </div>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.displayCardHeight, 64)}px` }}
                            className="bg-emerald-950/40 border-y border-emerald-500/60 px-2 py-1 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono font-black text-emerald-400 text-sm">#0041</span>
                            <span className="font-bold text-white uppercase text-[11px] truncate">JOÃO</span>
                            <span className="text-[10px] text-emerald-300 font-bold">PRONTO</span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia Caixa */}
                      <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] font-bold text-emerald-400 mb-1.5 flex items-center justify-between">
                          <span>Caixa (Rodapé)</span>
                          <span className="font-mono text-[9px] text-slate-400">{resolveHeightPx(systemSettings.cashierCardHeight, 42)}px | gap {resolveSpacingPx(systemSettings.cashierCardSpacing, 6)}px</span>
                        </div>
                        <div className="flex flex-col" style={{ gap: `${resolveSpacingPx(systemSettings.cashierCardSpacing, 6)}px` }}>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.cashierCardHeight, 42)}px` }}
                            className="bg-slate-950/90 border-y border-l-[3px] border-amber-400 rounded-l-md px-2 py-1 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono font-black text-amber-300">#0042</span>
                            <span className="font-bold text-slate-200 uppercase text-[10px] truncate">MARIA</span>
                            <span className="text-[8px] bg-slate-800 text-amber-300 px-1 py-0.2 rounded font-mono">EM PREPARO</span>
                          </div>
                          <div 
                            style={{ minHeight: `${resolveHeightPx(systemSettings.cashierCardHeight, 42)}px` }}
                            className="bg-slate-950/90 border-y border-l-[3px] border-emerald-400 rounded-l-md px-2 py-1 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono font-black text-emerald-400">#0041</span>
                            <span className="font-bold text-slate-200 uppercase text-[10px] truncate">JOÃO</span>
                            <span className="text-[8px] bg-slate-800 text-emerald-300 px-1 py-0.2 rounded font-mono">PRONTO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* PAINEL: EFEITOS & ÁUDIO + FONTES & TIPOGRAFIA (LADO A LADO EM 2 COLUNAS) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {/* EFEITOS VISUAIS & ÁUDIO */}
                <div className="bg-slate-900/95 rounded-xl border border-slate-800 p-3 shadow-xl space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-black text-white text-xs sm:text-sm tracking-wide">
                      EFEITOS VISUAIS & ÁUDIO
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Efeito Pulsante */}
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Efeito Pulsante nos Cards
                        </h4>
                        <p className="text-[10px] text-slate-400">Borda pulsante nos pedidos em preparo</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateSystemSetting('cardPulsing', systemSettings.cardPulsing === false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border shrink-0 cursor-pointer ${
                          systemSettings.cardPulsing !== false
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {systemSettings.cardPulsing !== false ? '✓ Ativado' : '✕ Desativado'}
                      </button>
                    </div>

                    {/* Sons e Alertas */}
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-amber-400" />
                          Sons e Alertas Sonoros
                        </h4>
                        <p className="text-[10px] text-slate-400">Sino de senha e aviso de novo pedido</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateSystemSetting('cardSoundEnabled', systemSettings.cardSoundEnabled === false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border shrink-0 cursor-pointer ${
                          systemSettings.cardSoundEnabled !== false
                            ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {systemSettings.cardSoundEnabled !== false ? '✓ Ativado' : '✕ Desativado'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* FONTES & TIPOGRAFIA */}
                <div className="bg-slate-900/95 rounded-xl border border-slate-800 p-3 shadow-xl space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <span className="p-1 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-black text-white text-xs sm:text-sm tracking-wide">
                      FONTES & TIPOGRAFIA
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'normal', label: 'Padrão', desc: '100% (Balcão)' },
                      { id: 'large', label: 'Grande', desc: '+20% (Monitores)' },
                      { id: 'xl', label: 'Extra G.', desc: '+40% (TVs)' }
                    ].map(f => {
                      const isSelected = (systemSettings.fontScale || 'normal') === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleUpdateSystemSetting('fontScale', f.id)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-800 border-purple-400 ring-1 ring-purple-400/50 shadow-sm'
                              : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {f.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {f.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL PERSONALIZADO DE CONFIRMAÇÃO: ZERAR / FECHAR TURNO */}
      {showResetModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-rose-500/50 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100 relative overflow-hidden cursor-default"
          >
            
            {/* GLOW DECORATIVO DE FUNDO */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* ÍCONE DE CABEÇALHO */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
                <RotateCcw className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">
                Zerar e Fechar Turno
              </h3>
              <p className="text-xs text-slate-400">
                Deseja encerrar o turno e zerar as telas da cantina?
              </p>
            </div>

            {/* CARDS EXPLICATIVOS SOBRE CÓPIA EM HISTÓRICO */}
            <div className="space-y-2.5">
              
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 flex items-start gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wide block">
                    Cópia Salva no Histórico
                  </span>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    O sistema guardará uma <strong>cópia completa de segurança</strong> de todas as <strong>{displayedOrders.length} vendas</strong> ({formatPrice(totalGeral, showCurrencySymbol)}) e do evento ativo <strong>"{currentEvent?.name || 'Cantina Geral'}"</strong> no histórico permanente.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3 text-left">
                <RotateCcw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide block">
                    Reinício das Filas de Pedidos
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    As filas de pedidos do <strong>Caixa</strong>, <strong>Cozinha</strong> e <strong>Painel TV</strong> serão zeradas para que você inicie o próximo turno com tela limpa.
                  </p>
                </div>
              </div>

            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmResetTurno}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isResetting ? (
                  <span>Arquivando...</span>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Zerar e Arquivar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO DE CONFIRMAÇÃO: EXCLUIR HISTÓRICO COMPLETO */}
      {showDeleteHistoryModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingHistory) setShowDeleteHistoryModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-rose-500/60 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100 relative overflow-hidden cursor-default text-center"
          >
            {/* GLOW DECORATIVO DE FUNDO */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* ÍCONE DE CABEÇALHO */}
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/40 shadow-lg shadow-rose-950/50">
              <Trash2 className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight">
                TEM CERTEZA MESMO QUE QUER EXCLUIR O HISTÓRICO?
              </h3>
              <p className="text-xs sm:text-sm font-black text-rose-400 uppercase tracking-wider bg-rose-950/80 border border-rose-500/50 py-1.5 px-3 rounded-xl inline-block shadow-inner">
                ESSA AÇÃO NÃO PODERÁ SER DESFEITA.
              </p>
              <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                Todos os <strong className="text-white">{turnoHistory.length} backup(s)</strong> de fechamentos anteriores serão apagados permanentemente do histórico local e da nuvem.
              </p>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteHistoryModal(false)}
                disabled={isDeletingHistory}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteHistory}
                disabled={isDeletingHistory}
                className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeletingHistory ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Histórico</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO DE CONFIRMAÇÃO: LIMPAR FILA / CACHE */}
      {showClearQueueModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowClearQueueModal(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-rose-500/60 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100 relative overflow-hidden cursor-default"
          >
            {/* GLOW DECORATIVO */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">
                ATENÇÃO!
              </h3>
              <p className="text-xs text-slate-300">
                Deseja limpar todos os pedidos e o cache da fila da Cozinha e do Painel TV?
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 text-center">
              Todos os pedidos atualmente em preparação ou entregues serão removidos das telas da Cozinha e do Painel.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowClearQueueModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={handleConfirmClearQueue}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                SIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ITEM PARA VENDA */}
      {showAddItemModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddItemModal(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-emerald-500/50 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 text-slate-100 relative cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Adicionar Item para Venda 🛒
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre um novo produto com nome, prefixo de senha e valor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewSaleItem} className="space-y-3.5">
              {/* LINHA 1: CATEGORIA (50%) + COZINHA DE PREPARO (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Categoria: *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setNewItemCategory(newCat);
                      if (newCat === 'acai') {
                        setNewItemPrefix('A-');
                        setNewItemDestination('COZINHA');
                      } else if (newCat === 'batata') {
                        setNewItemPrefix('B-');
                        setNewItemDestination('COZINHA');
                      } else if (newCat === 'pizza') {
                        setNewItemPrefix('Pp-');
                        setNewItemDestination('COZINHA');
                      } else if (newCat === '__NEW_CATEGORY__') {
                        setNewCategoryName('');
                        setNewItemPrefix('');
                      } else {
                        const matchedCat = categories.find(c => c.id === newCat);
                        setNewItemPrefix(matchedCat?.prefixDefault || `${newCat.substring(0, 3).toUpperCase()}-`);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__NEW_CATEGORY__">✨ + Criar Nova Categoria... (ex: Salada, Pão na Chapa)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cozinha de Preparo: *</span>
                  </label>
                  <select
                    value={newItemDestination}
                    onChange={(e) => setNewItemDestination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <optgroup label="🍳 Fogões / Cozinhas de Preparo" className="bg-slate-950 text-amber-400 font-bold">
                      {environments
                        .filter(env => 
                          env.type === 'kitchen' && 
                          env.id !== 'PUBLICO' && 
                          env.id !== 'ADMIN' && 
                          env.id !== 'TENDA' && 
                          !env.id.includes('TENDA') && 
                          (env.name || '').toUpperCase() !== 'TENDA' &&
                          !(env.id === 'COZINHA_2' && (env.description || '').toLowerCase().includes('fogões adicionais'))
                        )
                        .map((env) => (
                          <option key={env.id} value={env.id} className="bg-slate-900 text-white font-bold">
                            🍳 {env.name}
                          </option>
                        ))}
                      {!environments.some(e => e.id === 'COZINHA' && e.type === 'kitchen') && (
                        <option value="COZINHA" className="bg-slate-900 text-white font-bold">🍳 COZINHA PIZZA</option>
                      )}
                    </optgroup>
                    <optgroup label="📦 Direto sem Cozinha" className="bg-slate-950 text-emerald-400 font-bold">
                      <option value="none" className="bg-slate-900 text-emerald-300 font-bold">
                        📦 Balcão (Sem Preparo / Entrega Direta)
                      </option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {newItemCategory === '__NEW_CATEGORY__' && (
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Nome da Nova Categoria: *</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">(ex: Salada, Pão na Chapa, Sobremesas)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Salada, Pão na Chapa..."
                    value={newCategoryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCategoryName(val);
                      if (!newItemPrefix || newItemPrefix.endsWith('-')) {
                        const autoP = val.trim().substring(0, 3).toUpperCase();
                        if (autoP) setNewItemPrefix(`${autoP}-`);
                      }
                    }}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* LINHA 2: SABOR/NOME DO ITEM (50%) + PREÇO DE VENDA (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {newItemCategory === 'pizza' ? 'Sabor da Pizza: *' : 'Nome do Item: *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newItemCategory === 'pizza'
                        ? 'Ex: Marguerita, Calabresa, 4 Queijos...'
                        : 'Ex: Copo 400ml, Batata Frita, Suco...'
                    }
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Preço de Venda: *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-emerald-400">
                    {showCurrencySymbol && <span className="text-xs font-bold text-emerald-400 mr-1.5">R$</span>}
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(formatCurrencyMask(e.target.value))}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* LINHA 3: PREFIXO SENHA (50%) + DESCRIÇÃO (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prefixo Senha: * <span className="text-[10px] text-slate-400 font-normal">(Maiúsculo/Minúsculo)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pp-, Pi-, A-, B-, Ref-"
                    value={newItemPrefix}
                    onChange={(e) => setNewItemPrefix(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Descrição / Detalhes:
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newItemCategory === 'pizza'
                        ? 'Opcional (ex: Molho especial, queijo)'
                        : 'Opcional (ex: Gelada 350ml, 500g)'
                    }
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* SELETOR DE COR DO ITEM (24 BOLINHAS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cor de Destaque do Item:</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block border border-white/60 shadow-sm"
                      style={{ backgroundColor: newItemColor }}
                    />
                    <span className="font-bold text-slate-200">
                      {ITEM_COLOR_PALETTE.find(c => c.hex.toLowerCase() === newItemColor.toLowerCase())?.name || newItemColor}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
                  {ITEM_COLOR_PALETTE.map((col) => {
                    const isSelected = newItemColor.toLowerCase() === col.hex.toLowerCase();
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewItemColor(col.hex)}
                        title={col.name}
                        className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-130 relative flex items-center justify-center cursor-pointer shrink-0 border ${
                          isSelected 
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 border-white scale-125 shadow-md z-10' 
                            : 'border-white/20 hover:border-white/80 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3] drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar e Adicionar ao Cardápio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES COMPLETAS DO ITEM (ENGRENAGEM ⚙️) */}
      {showGearModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGearModal(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl p-6 space-y-4 text-slate-100 relative cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Settings className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Configurações Completas do Item ⚙️
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                    {gearItemData.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGearModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGearModal} className="space-y-3.5">
              {/* LINHA 1: NOME DO ITEM (50%) + CATEGORIA (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome do Item: *
                  </label>
                  <input
                    type="text"
                    required
                    value={gearItemData.name}
                    onChange={(e) => setGearItemData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Categoria: *
                  </label>
                  <select
                    value={gearItemData.categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const matchedCat = categories.find(c => c.id === newCatId);
                      setGearItemData(prev => ({ 
                        ...prev, 
                        categoryId: newCatId,
                        prefix: prev.prefix || matchedCat?.prefixDefault || 'Ped-'
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LINHA 2: COZINHA DE PREPARO (50%) + PREÇO DE VENDA (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cozinha de Preparo: *</span>
                  </label>
                  <select
                    value={gearItemData.destination || (gearItemData.categoryId === 'pizza' ? 'COZINHA' : 'none')}
                    onChange={(e) => setGearItemData(prev => ({ 
                      ...prev, 
                      destination: e.target.value,
                      sendToKitchen: e.target.value !== 'none'
                    }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <optgroup label="🍳 Fogões / Cozinhas de Preparo" className="bg-slate-950 text-amber-400 font-bold">
                      {environments
                        .filter(env => 
                          env.type === 'kitchen' && 
                          env.id !== 'PUBLICO' && 
                          env.id !== 'ADMIN' && 
                          env.id !== 'TENDA' && 
                          !env.id.includes('TENDA') && 
                          (env.name || '').toUpperCase() !== 'TENDA' &&
                          !(env.id === 'COZINHA_2' && (env.description || '').toLowerCase().includes('fogões adicionais'))
                        )
                        .map((env) => (
                          <option key={env.id} value={env.id} className="bg-slate-900 text-white font-bold">
                            🍳 {env.name}
                          </option>
                        ))}
                      {!environments.some(e => e.id === 'COZINHA' && e.type === 'kitchen') && (
                        <option value="COZINHA" className="bg-slate-900 text-white font-bold">🍳 COZINHA PIZZA</option>
                      )}
                    </optgroup>
                    <optgroup label="📦 Direto sem Cozinha" className="bg-slate-950 text-emerald-400 font-bold">
                      <option value="none" className="bg-slate-900 text-emerald-300 font-bold">
                        📦 Balcão (Sem Preparo / Entrega Direta)
                      </option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Preço de Venda: *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-amber-400">
                    {showCurrencySymbol && <span className="text-xs font-bold text-emerald-400 mr-1.5">R$</span>}
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={gearItemData.price}
                      onChange={(e) => setGearItemData(prev => ({ ...prev, price: formatCurrencyMask(e.target.value) }))}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* LINHA 3: PREFIXO DA SENHA (50%) + DESCRIÇÃO (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prefixo da Senha / Comanda: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pp-, Pi-, A-, B-"
                    value={gearItemData.prefix}
                    onChange={(e) => setGearItemData(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Descrição / Ingredientes:
                  </label>
                  <input
                    type="text"
                    placeholder="Descrição opcional do produto"
                    value={gearItemData.description}
                    onChange={(e) => setGearItemData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* FOTO REAL OU ÍCONE 2D VETORIAL DO PRODUTO (CARDS INTUITIVOS) */}
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Arte / Foto do Produto (Card Intuitivo):</span>
                  </label>
                  {(gearItemData.image || gearItemData.icon2d) && (
                    <button
                      type="button"
                      onClick={handleClearCustomArt}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Voltar ao ícone padrão automático"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Restaurar Padrão</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                  {/* Prévia do Ícone em formato de Card */}
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center p-1.5 shrink-0 shadow-inner relative group">
                    <ProductIcon2D 
                      item={gearItemData} 
                      category={categories.find(c => c.id === gearItemData.categoryId) || { id: gearItemData.categoryId }} 
                      className="w-14 h-14" 
                    />
                    {isProcessingImage && (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
                      </div>
                    )}
                  </div>

                  {/* Ações de Upload e Seleção */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botão de Upload de Foto */}
                      <label className="cursor-pointer px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isProcessingImage ? 'Processando...' : 'Carregar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isProcessingImage}
                        />
                      </label>

                      {/* Botão Escolher Ícone 2D */}
                      <button
                        type="button"
                        onClick={() => setShowPresetPicker(prev => !prev)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          showPresetPicker
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/60'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{showPresetPicker ? 'Fechar Galeria' : 'Galeria 2D (50 Ícones)'}</span>
                      </button>

                      {/* Indicador de Foto Ativa com Tamanho Reduzido */}
                      {gearItemData.image && (
                        <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-xs animate-fadeIn">
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                          <span>Foto Ativa (~{Math.max(1, Math.round((gearItemData.image.length * 0.75) / 1024))} KB)</span>
                        </span>
                      )}
                    </div>

                    {/* Toggle de Remoção Automática de Fundo */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRemoveBg}
                        onChange={(e) => setAutoRemoveBg(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-slate-300">
                        Remover fundo automaticamente (efeito adesivo)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Galeria Expansível de Ícones 2D Presets (50 ícones) */}
                {showPresetPicker && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 animate-fadeIn">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Toque para escolher entre os 50 ícones vetoriais 2D:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                      {PRODUCT_2D_PRESETS.map((preset) => {
                        const isSelected = gearItemData.icon2d === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                            }`}
                            title={preset.label}
                          >
                            <ProductIcon2D iconKey={preset.id} className="w-8 h-8" />
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

              {/* SELETOR DE COR DO ITEM (24 BOLINHAS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cor de Destaque do Item:</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block border border-white/60 shadow-sm"
                      style={{ backgroundColor: gearItemData.color || '#eab308' }}
                    />
                    <span className="font-bold text-slate-200">
                      {ITEM_COLOR_PALETTE.find(c => c.hex.toLowerCase() === (gearItemData.color || '#eab308').toLowerCase())?.name || gearItemData.color}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
                  {ITEM_COLOR_PALETTE.map((col) => {
                    const isSelected = (gearItemData.color || '#eab308').toLowerCase() === col.hex.toLowerCase();
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setGearItemData(prev => ({ ...prev, color: col.hex }))}
                        title={col.name}
                        className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-130 relative flex items-center justify-center cursor-pointer shrink-0 border ${
                          isSelected 
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 border-white scale-125 shadow-md z-10' 
                            : 'border-white/20 hover:border-white/80 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3] drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
                {!gearItemData.isVariation ? (
                  !confirmDeleteGear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteGear(true)}
                      className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Item</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <button
                        type="button"
                        onClick={handleDeleteGearItem}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sim, Excluir!</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGear(false)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Item base da cantina
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGearModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BONITO DE CONFIRMAÇÃO DE EXCLUSÃO DE VENDA */}
      {cancelConfirmModal.isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelConfirmModal({ isOpen: false, order: null });
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-rose-500/80 w-full max-w-md rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.35)] p-6 space-y-5 text-slate-100 relative cursor-default animate-modal-delivered"
          >
            {/* CABEÇALHO COM ÍCONE ATENÇÃO */}
            <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shadow-inner">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-400 tracking-wider uppercase">
                  ATENÇÃO!
                </h3>
                <p className="text-xs text-slate-400">
                  Confirmação de exclusão do item vendido
                </p>
              </div>
            </div>

            {/* MENSAGEM PRINCIPAL SOLICITADA PELO USUÁRIO */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                Tem certeza da exclusão do item vendido? Isso impacta no balanço final, mas estará no histórico para futura auditoria.
              </p>

              {/* CARD RESUMO DO ITEM A SER EXCLUÍDO */}
              {cancelConfirmModal.order && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Comanda:</span>
                    <span className="font-black text-amber-400 text-sm">{cancelConfirmModal.order.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="font-bold text-white uppercase">{cancelConfirmModal.order.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Item:</span>
                    <span className="text-slate-200 font-semibold">{cancelConfirmModal.order.fullDescription || cancelConfirmModal.order.itemName}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1">
                    <span className="text-slate-400">Valor a deduzir:</span>
                    <span className="font-black text-rose-400 text-sm">{formatPrice(cancelConfirmModal.order.totalPrice, showCurrencySymbol)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÕES SIM / NÃO */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelConfirmModal({ isOpen: false, order: null })}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4" />
                <span>NÃO</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer border border-rose-400/50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BONITO DE CONFIRMAÇÃO DE EXCLUSÃO DE ITEM DO CARDÁPIO */}
      {deleteItemConfirmModal.isOpen && (
        <div 
          onClick={() => setDeleteItemConfirmModal({ isOpen: false, item: null })}
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-rose-500/80 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 animate-modal-pop cursor-default"
          >
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-black text-rose-400 tracking-wider uppercase">
                  ATENÇÃO!
                </h3>
                <p className="text-xs text-slate-400">
                  Confirmação de exclusão do item do cardápio
                </p>
              </div>
            </div>

            {/* MENSAGEM PRINCIPAL */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                Tem certeza que deseja excluir o item cadastrado? Ele deixará de aparecer para venda no caixa.
              </p>

              {/* CARD RESUMO DO ITEM */}
              {deleteItemConfirmModal.item && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Nome do Item:</span>
                    <span className="font-black text-amber-300 text-sm">{deleteItemConfirmModal.item.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Prefixo Senha:</span>
                    <span className="font-bold text-white">{deleteItemConfirmModal.item.prefix || 'Sem prefixo'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1">
                    <span className="text-slate-400 font-sans">Valor de Venda:</span>
                    <span className="font-black text-emerald-400 text-sm">{formatPrice(deleteItemConfirmModal.item.price, showCurrencySymbol)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÕES SIM / NÃO */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItemConfirmModal({ isOpen: false, item: null })}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4" />
                <span>NÃO</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer border border-rose-400/50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA CATEGORIA DE ITENS (SALADA, PÃO NA CHAPA, ETC.) */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-md w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FolderPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase">
                    Nova Categoria de Itens
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ex: Salada, Pão na Chapa, Sucos, Sobremesas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCategory} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome da Categoria: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salada, Pão na Chapa, Sobremesas..."
                  value={newCatNameInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCatNameInput(val);
                    if (!newCatPrefixInput || newCatPrefixInput.endsWith('-')) {
                      const autoP = val.trim().substring(0, 3).toUpperCase();
                      if (autoP) setNewCatPrefixInput(`${autoP}-`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Prefixo Sugerido para Senhas:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sal-, Pch-, Beb-"
                  value={newCatPrefixInput}
                  onChange={(e) => setNewCatPrefixInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Identifica os pedidos nos comprovantes e painéis (ex: Sal-01, Pch-01).
                </span>
              </div>

              {/* LISTA DE CATEGORIAS PERSONALIZADAS EXISTENTES COM OPÇÃO DE EXCLUIR */}
              {categories.some(c => !['pizza', 'acai', 'batata'].includes(c.id)) && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Categorias Personalizadas Cadastradas:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id)).map(c => (
                      <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white uppercase">{c.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({(c.items || []).length} itens)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteCatConfirmModal({ isOpen: true, category: c })}
                          className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title={`Excluir categoria "${c.name}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Categoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVO AMBIENTE (EX: COZINHA 2) */}
      {showAddEnvModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-md w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ChefHat className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase">
                    Novo Ambiente de Trabalho
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre Cozinha 2, Bar, Pizzaria, etc.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEnvModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnvironment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Ambiente: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: COZINHA 2, PIZZARIA..."
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tipo de Operação: *
                </label>
                <select
                  value={newEnvType}
                  onChange={(e) => setNewEnvType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="kitchen">🍳 Cozinha / Produção</option>
                  <option value="cashier">🏪 Caixa / Vendas</option>
                  <option value="display">📺 Painel TV / Público</option>
                </select>
              </div>

              {/* SE FOR PAINEL TV: ESCOLHA SE É TV GERAL OU EXCLUSIVA DE UMA COZINHA */}
              {newEnvType === 'display' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-emerald-300 block">
                    📺 Exibição Exclusiva (Vincular à Cozinha):
                  </label>
                  <select
                    value={newEnvLinkedKitchen}
                    onChange={(e) => setNewEnvLinkedKitchen(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="">🌐 Painel TV Geral (Exibe pedidos e chamadas de todas as cozinhas)</option>
                    {environments.filter(e => e.type === 'kitchen' && e.id !== 'ADMIN' && e.id !== 'PUBLICO' && e.id !== 'TENDA' && !(e.id === 'COZINHA_2' && (e.description || '').toLowerCase().includes('fogões adicionais'))).map((k) => (
                      <option key={k.id} value={k.id}>
                        🍳 Exclusivo de: {k.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                    Se você escolher uma cozinha específica, esta TV tocará o sino e chamará os clientes <strong>apenas</strong> dos itens daquela cozinha!
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição / Função (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Preparo de lanches rápidos, churrasco, etc."
                  value={newEnvDesc}
                  onChange={(e) => setNewEnvDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-400"
                />
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-300 mb-0.5">💡 Acesso flexível:</p>
                O ambiente fica disponível imediatamente na tela de perfis e pode ser acessado direto sem necessidade de e-mail cadastrado.
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEnvModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR / CONFIGURAR AMBIENTE (INCLUSIVE O NOME) */}
      {showEditEnvModal && editingEnv && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-md w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Pencil className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase">
                    Configurar Ambiente
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Altere o nome, tipo e descrição do ambiente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowEditEnvModal(false); setEditingEnv(null); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEnv} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Ambiente: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: COZINHA 2 XX"
                  value={editingEnv.name}
                  onChange={(e) => setEditingEnv({ ...editingEnv, name: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold uppercase outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tipo de Operação: *
                </label>
                <select
                  value={editingEnv.type}
                  disabled={editingEnv.isSystem}
                  onChange={(e) => setEditingEnv({ ...editingEnv, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="kitchen">🍳 Cozinha / Produção</option>
                  <option value="cashier">🏪 Caixa / Vendas</option>
                  <option value="display">📺 Painel TV / Público</option>
                </select>
              </div>

              {/* SE FOR PAINEL TV: ESCOLHA SE É TV GERAL OU EXCLUSIVA DE UMA COZINHA */}
              {editingEnv.type === 'display' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-emerald-300 block">
                    📺 Exibição Exclusiva (Vincular à Cozinha):
                  </label>
                  <select
                    value={editingEnv.linkedKitchen || ''}
                    onChange={(e) => setEditingEnv({ ...editingEnv, linkedKitchen: e.target.value })}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="">🌐 Painel TV Geral (Exibe pedidos e chamadas de todas as cozinhas)</option>
                    {environments.filter(e => e.type === 'kitchen' && e.id !== 'ADMIN' && e.id !== 'PUBLICO' && e.id !== 'TENDA' && !(e.id === 'COZINHA_2' && (e.description || '').toLowerCase().includes('fogões adicionais'))).map((k) => (
                      <option key={k.id} value={k.id}>
                        🍳 Exclusivo de: {k.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                    Se você escolher uma cozinha específica, esta TV tocará o sino e chamará os clientes <strong>apenas</strong> dos itens daquela cozinha!
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição / Função (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Produção de pizzas e lanches..."
                  value={editingEnv.description}
                  onChange={(e) => setEditingEnv({ ...editingEnv, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditEnvModal(false); setEditingEnv(null); }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Nome</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE AMBIENTE */}
      {deleteEnvConfirmModal.isOpen && deleteEnvConfirmModal.env && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl shadow-black space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-black text-rose-400 tracking-wider uppercase">
                  ATENÇÃO!
                </h3>
                <p className="text-xs text-slate-400">
                  Excluir Ambiente de Trabalho
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                Tem certeza que deseja excluir o ambiente <strong className="text-rose-400">"{deleteEnvConfirmModal.env.name}"</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteEnvConfirmModal({ isOpen: false, env: null })}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4" />
                <span>NÃO</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteEnv}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer border border-rose-400/50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: EXCLUIR CATEGORIA PERSONALIZADA (EX: SALADA) */}
      {deleteCatConfirmModal.isOpen && deleteCatConfirmModal.category && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteCatConfirmModal({ isOpen: false, category: null });
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn"
        >
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Excluir Categoria
              </h3>
              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                Tem certeza que deseja excluir a categoria <strong className="text-rose-400 uppercase">"{deleteCatConfirmModal.category.name}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                {(deleteCatConfirmModal.category.items || []).length > 0 
                  ? 'Todos os itens desta categoria também deixarão de aparecer para venda no caixa.'
                  : 'Esta categoria será removida permanentemente do cardápio e do caixa.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCatConfirmModal({ isOpen: false, category: null })}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4" />
                <span>NÃO</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteCatConfirmModal.category)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer border border-rose-400/50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>SIM, EXCLUIR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: REABRIR CAIXA DE TURNO ANTERIOR */}
      {reopenTurnoConfirmModal.isOpen && reopenTurnoConfirmModal.turno && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReopeningTurno) setReopenTurnoConfirmModal({ isOpen: false, turno: null });
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn"
        >
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black space-y-4 text-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <RotateCcw className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white tracking-wide uppercase">
                  Reabrir Caixa
                </h3>
                <p className="text-xs text-emerald-400 font-mono">
                  {reopenTurnoConfirmModal.turno.archivedAtFormatted || 'Turno Arquivado'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-left">
                <div className="text-xs font-bold text-slate-300">
                  Evento: <strong className="text-amber-400">{reopenTurnoConfirmModal.turno.event?.name || 'Cantina Geral'}</strong>
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                  <span>Total Vendas: <strong>{reopenTurnoConfirmModal.turno.totalOrders} comandas</strong></span>
                  <span className="text-emerald-400 font-black">{formatPrice(reopenTurnoConfirmModal.turno.totalRevenue, showCurrencySymbol)}</span>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 text-left text-xs text-amber-200/90 leading-relaxed">
                Ao reabrir este caixa, <strong>todas as comandas deste turno voltarão a ficar ativas</strong> nas telas do Caixa, Cozinha e Painel TV para que você possa continuar lançando, alterando ou conferindo vendas.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isReopeningTurno}
                onClick={() => setReopenTurnoConfirmModal({ isOpen: false, turno: null })}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isReopeningTurno}
                onClick={handleConfirmReopenTurno}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer border border-emerald-400/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isReopeningTurno ? 'animate-spin' : ''}`} />
                <span>{isReopeningTurno ? 'Reabrindo...' : 'Sim, Reabrir Caixa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFERÊNCIA APROFUNDADA DO TURNO */}
      {selectedTurnoForConference && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTurnoForConference(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-[9999] animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-black text-slate-100 overflow-hidden"
          >
            {/* CABEÇALHO DO MODAL DE CONFERÊNCIA */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
                  <Search className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <span>Conferência Aprofundada do Turno</span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded-lg border border-amber-500/40">
                      {selectedTurnoForConference.event?.name || 'Cantina Geral'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Arquivado em: 📅 {selectedTurnoForConference.archivedAtFormatted || (selectedTurnoForConference.archivedAt ? new Date(selectedTurnoForConference.archivedAt).toLocaleString('pt-BR') : '')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTurnoForConference(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CORPO ROLÁVEL DA CONFERÊNCIA */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
              
              {/* GRID FINANCEIRO DETALHADO */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-slate-950/90 p-3 rounded-2xl border border-emerald-500/40 shadow-sm">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Faturamento Total</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    {formatPrice(selectedTurnoForConference.totalRevenue, showCurrencySymbol)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{selectedTurnoForConference.totalOrders} comandas</div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">PIX</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    {formatPrice(selectedTurnoForConference.paymentBreakdown?.pix, showCurrencySymbol)}
                  </div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="text-[10px] font-black text-teal-400 uppercase tracking-wider">Dinheiro</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    {formatPrice(selectedTurnoForConference.paymentBreakdown?.dinheiro, showCurrencySymbol)}
                  </div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Cartão Débito</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    {formatPrice(selectedTurnoForConference.paymentBreakdown?.debito, showCurrencySymbol)}
                  </div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Cartão Crédito</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    {formatPrice(selectedTurnoForConference.paymentBreakdown?.credito, showCurrencySymbol)}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: BALANÇO DE PRODUTOS VENDIDOS (AUDITORIA DE ITENS) */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Pizza className="w-4 h-4 text-amber-400" />
                    <span>Produtos e Quantidades Vendidas neste Turno</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {getTurnoItemBreakdown(selectedTurnoForConference.orders || []).length} produtos diferentes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {getTurnoItemBreakdown(selectedTurnoForConference.orders || []).map((prod, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Un: {formatPrice(prod.unitPrice, showCurrencySymbol)}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {prod.quantity}x
                        </span>
                        <div className="text-xs font-black text-emerald-400 font-mono mt-1">
                          {formatPrice(prod.totalValue, showCurrencySymbol)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO 2: LISTA COMPLETA DE COMANDAS DO TURNO */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Todas as Comandas Deste Turno ({(selectedTurnoForConference.orders || []).length})</span>
                  </h4>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="p-2.5">Comanda</th>
                        <th className="p-2.5">Cliente</th>
                        <th className="p-2.5">Itens</th>
                        <th className="p-2.5">Pagamento</th>
                        <th className="p-2.5 text-right">Valor</th>
                        <th className="p-2.5 text-center">Horário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {(selectedTurnoForConference.orders || []).map((ord, idx) => {
                        const items = ord.items && ord.items.length > 0 
                          ? ord.items 
                          : [{ name: ord.itemName || ord.fullDescription || 'Item', quantity: ord.quantity || 1 }];
                        return (
                          <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-2.5 font-black text-orange-400">{ord.orderNumber}</td>
                            <td className="p-2.5 font-sans font-bold text-slate-100 uppercase">{ord.customerName}</td>
                            <td className="p-2.5 font-sans text-[11px] text-slate-300">
                              {items.map(it => `${it.quantity}x ${it.description || it.name || it.itemName}`).join(', ')}
                            </td>
                            <td className="p-2.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {ord.paymentMethod || 'PIX'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-400">
                              {formatPrice(ord.totalPrice, showCurrencySymbol)}
                            </td>
                            <td className="p-2.5 text-center text-slate-500 text-[10px]">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RODAPÉ DO MODAL DE CONFERÊNCIA */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTurnoForConference(null)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRequestReopenTurno(selectedTurnoForConference);
                }}
                className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center gap-2 border border-emerald-400"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>Reabrir Este Caixa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
