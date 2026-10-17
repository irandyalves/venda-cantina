import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../services/storage';
import { authService, PERFIS } from '../services/auth';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';
import AutoToast from './AutoToast';

export default function ConfigModal({ isOpen, onClose, initialTab = 'products' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'products', 'firebase', 'reports', 'emails'
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Modal Bonito de 2 Segundos (AutoToast)
  const [toast, setToast] = useState(null);
  const showToast = (message, title = 'Sucesso!', type = 'success', subtext = null) => {
    setToast({ message, title, type, subtext });
  };

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

  // Estado Perfis e Emails
  const [emailRules, setEmailRules] = useState(authService.getEmailRules());
  const [selectedProfileForEmail, setSelectedProfileForEmail] = useState(PERFIS.ADMIN);
  const [newEmailInput, setNewEmailInput] = useState('');

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

  // Estado Configurações da TV
  const [tvSettings, setTvSettings] = useState(storageService.getTVSettings());
  const [kitchenSettings, setKitchenSettings] = useState(() => storageService.getKitchenSettings());

  // Estado Evento da Cantina
  const [currentEvent, setCurrentEvent] = useState(() => storageService.getCurrentEvent());
  const [eventsList, setEventsList] = useState(() => storageService.getEventsList());
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado Modal de Zerar Turno e Histórico Arquivado
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearQueueModal, setShowClearQueueModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [turnoHistory, setTurnoHistory] = useState(() => storageService.getTurnoHistory());
  const [showHistoryList, setShowHistoryList] = useState(false);

  // Preços de pizza (Pedaço e Inteira com máscara 0,00)
  const [pedacoPrice, setPedacoPrice] = useState('9,00');
  const [inteiraPrice, setInteiraPrice] = useState('48,00');

  // Modal de Adicionar Item para Venda
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('acai');
  const [newItemPrice, setNewItemPrice] = useState('0,00');
  const [newItemPrefix, setNewItemPrefix] = useState('A-');
  const [newItemDesc, setNewItemDesc] = useState('');

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
    variationId: null
  });
  const [confirmDeleteGear, setConfirmDeleteGear] = useState(false);

  // Estado do Modal Bonito de Confirmação de Exclusão de Venda (Substitui window.confirm)
  const [cancelConfirmModal, setCancelConfirmModal] = useState({
    isOpen: false,
    order: null
  });

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab]);

  // Fechar com tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
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
        if (showClearQueueModal) {
          setShowClearQueueModal(false);
          return;
        }
        if (editingItemId) {
          handleCancelEditItem();
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cancelConfirmModal.isOpen, showAddItemModal, showGearModal, showResetModal, showClearQueueModal, editingItemId, onClose]);

  const loadData = () => {
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
    setTvSettings(storageService.getTVSettings());
    setKitchenSettings(storageService.getKitchenSettings());
    setCurrentEvent(storageService.getCurrentEvent());
    setEventsList(storageService.getEventsList());
    setTurnoHistory(storageService.getTurnoHistory());
    setOrders(storageService.getLocalOrders());
  };

  if (!isOpen) return null;

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

  // Abrir Modal de Configurações Completas do Item (Engrenagem ⚙️)
  const handleOpenGearModal = (item) => {
    setConfirmDeleteGear(false);
    setGearItemData({
      id: item.id,
      name: item.name || '',
      price: formatCurrencyMask(item.price || 0),
      prefix: item.prefix || '',
      description: item.description || '',
      categoryId: item.categoryId || 'acai',
      isVariation: Boolean(item.isVariation),
      variationId: item.variationId || null
    });
    setShowGearModal(true);
  };

  // Salvar alterações da Engrenagem ⚙️
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

    const updated = categories.map(cat => {
      // Se for variação de pizza (Pedaço ou Inteira)
      if (gearItemData.isVariation && cat.id === 'pizza') {
        return {
          ...cat,
          variations: (cat.variations || []).map(v => {
            if (v.id === gearItemData.variationId) {
              return {
                ...v,
                name: cleanName.replace(/^Pizza\s+/i, ''),
                price: priceNum,
                prefix: cleanPrefix
              };
            }
            return v;
          })
        };
      }

      // Se o item estiver nesta categoria
      if (cat.id === gearItemData.categoryId) {
        return {
          ...cat,
          items: (cat.items || []).map(it => {
            if (it.id === gearItemData.id) {
              return {
                ...it,
                name: cleanName,
                price: priceNum,
                prefix: cleanPrefix,
                description: cleanDesc
              };
            }
            return it;
          })
        };
      }
      return cat;
    });

    if (gearItemData.isVariation) {
      if (gearItemData.variationId === 'pedaco') {
        setPedacoPrice(formatCurrencyMask(priceNum));
        setPedacoPrefix(cleanPrefix);
      } else if (gearItemData.variationId === 'inteira') {
        setInteiraPrice(formatCurrencyMask(priceNum));
        setInteiraPrefix(cleanPrefix);
      }
    }

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

  // Adicionar novo item para venda
  const handleAddNewSaleItem = (e) => {
    if (e) e.preventDefault();
    const cleanName = newItemName.trim();
    if (!cleanName) {
      showToast('O nome do item é obrigatório!', 'Atenção', 'error');
      return;
    }

    const priceNum = parseCurrencyMask(newItemPrice);
    const cleanPrefix = newItemPrefix.trim() || (newItemCategory === 'acai' ? 'A-' : newItemCategory === 'batata' ? 'B-' : 'Ped-');
    const cleanDesc = newItemDesc.trim();

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      price: priceNum,
      prefix: cleanPrefix,
      description: cleanDesc
    };

    let updated = [...categories];
    const catIndex = updated.findIndex(c => c.id === newItemCategory);
    if (catIndex >= 0) {
      updated[catIndex] = {
        ...updated[catIndex],
        items: [...(updated[catIndex].items || []), newItem]
      };
    } else {
      updated.push({
        id: newItemCategory,
        name: newItemCategory === 'outros' ? 'OUTROS ITENS' : newItemCategory.toUpperCase(),
        icon: 'Utensils',
        prefixDefault: cleanPrefix,
        items: [newItem],
        variations: []
      });
    }

    storageService.saveProducts(updated);
    setCategories(updated);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemPrice('0,00');
    setNewItemPrefix('');
    setNewItemDesc('');
    showToast(`"${cleanName}" adicionado para venda com sucesso!`, 'Item Cadastrado');
  };

  // Atualização direta do prefixo no card (aceita maiúsculo e minúsculo)
  const handleUpdateItemPrefix = (newPrefix, item) => {
    if (item.isVariation) {
      if (item.variationId === 'pedaco') setPedacoPrefix(newPrefix);
      if (item.variationId === 'inteira') setInteiraPrefix(newPrefix);
    }

    setCategories(prev => prev.map(cat => {
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
    }));
  };

  // Atualização direta do valor (preço) no card
  const handleUpdateItemPrice = (newPriceMasked, item) => {
    const formatted = formatCurrencyMask(newPriceMasked);
    const num = parseCurrencyMask(formatted);

    if (item.isVariation) {
      if (item.variationId === 'pedaco') setPedacoPrice(formatted);
      if (item.variationId === 'inteira') setInteiraPrice(formatted);
    }

    setCategories(prev => prev.map(cat => {
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
    }));
  };

  // Salvar todos os itens e prefixos
  const handleSaveAllPrefixes = () => {
    storageService.saveProducts(categories);
    showToast('Itens cadastrados para venda e senhas salvos com sucesso!', 'Itens Salvos');
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

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

  // Vendas ativas (exclui vendas canceladas/excluídas do cálculo financeiro)
  const activeOrders = todayOrders.filter(o => o.status !== 'cancelado');
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

  const pizzaCat = categories.find(c => c.id === 'pizza');
  const acaiCat = categories.find(c => c.id === 'acai');
  const batataCat = categories.find(c => c.id === 'batata');

  // Coleta todos os itens cadastrados para venda (Pizza Pedaço/Inteira, Copos Açaí, Batatas e outros)
  const allSaleItems = [];

  // Pizza variações (Pedaço e Inteira)
  if (pizzaCat?.variations) {
    pizzaCat.variations.forEach(v => {
      allSaleItems.push({
        id: v.id,
        name: `Pizza ${v.name}`,
        price: v.id === 'pedaco' ? parseCurrencyMask(pedacoPrice) : parseCurrencyMask(inteiraPrice),
        prefix: v.id === 'pedaco' ? pedacoPrefix : inteiraPrefix,
        categoryId: 'pizza',
        isVariation: true,
        variationId: v.id,
        description: v.id === 'pedaco' ? 'Fatia individual de pizza' : 'Pizza inteira 8 fatias'
      });
    });
  }

  // Açaí itens
  if (acaiCat?.items) {
    acaiCat.items.forEach(it => {
      allSaleItems.push({
        id: it.id,
        name: it.name,
        price: it.price,
        prefix: it.prefix || acaiPrefix || 'A-',
        categoryId: 'acai',
        isVariation: false,
        description: it.description || 'Opção de açaí'
      });
    });
  }

  // Batata itens
  if (batataCat?.items) {
    batataCat.items.forEach(it => {
      allSaleItems.push({
        id: it.id,
        name: it.name,
        price: it.price,
        prefix: it.prefix || batataPrefix || 'B-',
        categoryId: 'batata',
        isVariation: false,
        description: it.description || 'Opção de batata frita'
      });
    });
  }

  // Outras categorias adicionais cadastradas
  categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id)).forEach(cat => {
    (cat.items || []).forEach(it => {
      allSaleItems.push({
        id: it.id,
        name: it.name,
        price: it.price,
        prefix: it.prefix || cat.prefixDefault || 'Ped-',
        categoryId: cat.id,
        isVariation: false,
        description: it.description || ''
      });
    });
  });

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans cursor-default"
      >
        
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PAINEL DE CONFIGURAÇÕES & GESTÃO ⚙️
              </h2>
              <p className="text-xs text-slate-400">Cardápio, Perfis/E-mails, Firebase e Caixa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cardápio & Vendas</span>
          </button>

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

          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'emails'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Perfis & E-mails</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Conexão Firebase</span>
          </button>

          <button
            onClick={() => setActiveTab('tv')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'tv'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Telas & Som (TV/Cozinha)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-slate-800 text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Fechamento de Caixa</span>
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* =========================================================
              ABA: PERFIS E CADASTRO DE E-MAILS (NOVO)
             ========================================================= */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-white text-base">Cadastrar E-mails dos Perfis</h3>
                    <p className="text-xs text-slate-400">
                      Vincule os e-mails do Google a cada perfil (ADMIN, COZINHA, PÚBLICO). Ao fazer login com o Google, o usuário é direcionado automaticamente para seu perfil!
                    </p>
                  </div>
                </div>

                {/* FORMULÁRIO DE CADASTRO DE E-MAIL */}
                <form onSubmit={handleAddEmail} className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    
                    <div className="sm:col-span-4">
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Escolha o Perfil:
                      </label>
                      <select
                        value={selectedProfileForEmail}
                        onChange={(e) => setSelectedProfileForEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-amber-400"
                      >
                        <option value={PERFIS.ADMIN}>👑 ADMIN (Caixa & Gestão)</option>
                        <option value={PERFIS.COZINHA}>👨‍🍳 COZINHA (KDS)</option>
                        <option value={PERFIS.PUBLICO}>📺 PÚBLICO (Painel TV)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        E-mail Google do Usuário:
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="exemplo@gmail.com"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Cadastrar</span>
                      </button>
                    </div>

                  </div>
                </form>

                {/* LISTAGEM DOS E-MAILS POR PERFIL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  
                  {/* ADMIN EMAILS */}
                  <div className="bg-slate-900 p-4 rounded-xl border-2 border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-black text-sm text-amber-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>ADMIN</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {emailRules.ADMIN?.length || 0} e-mails
                      </span>
                    </div>

                    <div className="space-y-1.5 min-h-[100px]">
                      {emailRules.ADMIN?.length > 0 ? (
                        emailRules.ADMIN.map((email) => (
                          <div key={email} className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-200 truncate">{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(PERFIS.ADMIN, email)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remover e-mail"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Nenhum e-mail cadastrado.</p>
                      )}
                    </div>
                  </div>

                  {/* COZINHA EMAILS */}
                  <div className="bg-slate-900 p-4 rounded-xl border-2 border-orange-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-black text-sm text-orange-400">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>COZINHA</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        {emailRules.COZINHA?.length || 0} e-mails
                      </span>
                    </div>

                    <div className="space-y-1.5 min-h-[100px]">
                      {emailRules.COZINHA?.length > 0 ? (
                        emailRules.COZINHA.map((email) => (
                          <div key={email} className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-200 truncate">{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(PERFIS.COZINHA, email)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remover e-mail"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Nenhum e-mail cadastrado.</p>
                      )}
                    </div>
                  </div>

                  {/* PÚBLICO EMAILS */}
                  <div className="bg-slate-900 p-4 rounded-xl border-2 border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-black text-sm text-emerald-400">
                        <Tv className="w-4 h-4" />
                        <span>PÚBLICO</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {emailRules.PUBLICO?.length || 0} e-mails
                      </span>
                    </div>

                    <div className="space-y-1.5 min-h-[100px]">
                      {emailRules.PUBLICO?.length > 0 ? (
                        emailRules.PUBLICO.map((email) => (
                          <div key={email} className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-200 truncate">{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(PERFIS.PUBLICO, email)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remover e-mail"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Qualquer usuário / acesso público liberado.</p>
                      )}
                    </div>
                  </div>

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
                      <p className="text-xs text-slate-400">
                        Edite senhas e valores diretamente abaixo ou clique na engrenagem ⚙️ para configurações completas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAddItemModal(true)}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Item para Venda</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAllPrefixes}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </div>

                {/* GRID DOS ITENS CADASTRADOS PARA VENDA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allSaleItems.map((item) => (
                    <div 
                      key={`${item.categoryId}_${item.id}`} 
                      className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 space-y-2 hover:border-amber-500/50 transition-colors shadow-sm flex flex-col justify-between"
                    >
                      {/* TOPO: NOME E BOTÃO ENGRENAGEM (SEM O 'Ex: xxx') */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-white uppercase truncate" title={item.name}>
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenGearModal(item)}
                          className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Configurações completas deste item"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* EMBAIXO: PREFIXO SENHA (ACEITA MAIÚSCULO E MINÚSCULO) E VALOR */}
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800">
                        {/* PREFIXO SENHA */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                            Senha (Prefixo)
                          </label>
                          <input
                            type="text"
                            value={item.prefix || ''}
                            onChange={(e) => handleUpdateItemPrefix(e.target.value, item)}
                            placeholder="Pp-"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* VALOR */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5 text-right">
                            Valor (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatCurrencyMask(item.price)}
                            onChange={(e) => handleUpdateItemPrice(e.target.value, item)}
                            placeholder="0,00"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-emerald-400 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* SEÇÃO PIZZA: PREÇOS E SABORES (SEM BOTÃO RESTAURAR PADRÕES) */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Pizza className="w-5 h-5 text-red-400" />
                    <h3 className="font-extrabold text-white text-base">Configurações de Pizza</h3>
                  </div>
                </div>

                {/* DEFINIR PREÇOS DE PEDAÇO E INTEIRA EM REAIS COM DIGITAÇÃO DIRETA */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    
                    {/* PREÇO PEDAÇO */}
                    <div>
                      <label className="text-[11px] font-black text-amber-400 uppercase block mb-1">
                        Preço Pedaço (R$)
                      </label>
                      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg overflow-hidden focus-within:border-amber-400">
                        <span className="bg-slate-700/70 text-amber-300 px-2.5 py-1.5 font-black text-xs border-r border-slate-600">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pedacoPrice}
                          onChange={(e) => setPedacoPrice(formatCurrencyMask(e.target.value))}
                          placeholder="9,00"
                          className="w-24 bg-transparent px-2.5 py-1.5 font-black text-white text-sm outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* PREÇO INTEIRA */}
                    <div>
                      <label className="text-[11px] font-black text-red-400 uppercase block mb-1">
                        Preço Inteira (R$)
                      </label>
                      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg overflow-hidden focus-within:border-red-400">
                        <span className="bg-slate-700/70 text-red-300 px-2.5 py-1.5 font-black text-xs border-r border-slate-600">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={inteiraPrice}
                          onChange={(e) => setInteiraPrice(formatCurrencyMask(e.target.value))}
                          placeholder="48,00"
                          className="w-24 bg-transparent px-2.5 py-1.5 font-black text-white text-sm outline-none font-mono"
                        />
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={handleSavePizzaPrices}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Salvar Preços de Pizza
                  </button>
                </div>

                {/* ADICIONAR NOVO SABOR DE PIZZA (COM PREFIXO PERSONALIZADO OPCIONAL) */}
                <form onSubmit={handleAddPizzaFlavor} className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nome do novo sabor (ex: Portuguesa)"
                    value={newPizzaFlavor}
                    onChange={(e) => setNewPizzaFlavor(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Descrição / Ingredientes (opcional)"
                    value={newPizzaDesc}
                    onChange={(e) => setNewPizzaDesc(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Prefixo senha (opcional, ex: Pp-)"
                    value={newPizzaPrefix}
                    onChange={(e) => setNewPizzaPrefix(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-amber-300 outline-none focus:border-amber-400 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Sabor
                  </button>
                </form>

                {/* LISTA DOS SABORES ATUAIS COM MODO DE EDIÇÃO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                  {pizzaCat?.items.map((flavor) => {
                    const isEditing = editingItemId === flavor.id;

                    if (isEditing) {
                      return (
                        <div
                          key={flavor.id}
                          className="bg-slate-900 p-3 rounded-xl border-2 border-amber-500 shadow-xl space-y-2 col-span-1"
                        >
                          <div className="text-[10px] font-black uppercase text-amber-400">
                            Editar Sabor de Pizza
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Nome do Sabor:</label>
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              placeholder="Nome do sabor"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Descrição / Ingredientes:</label>
                            <input
                              type="text"
                              value={editItemDesc}
                              onChange={(e) => setEditItemDesc(e.target.value)}
                              placeholder="Ingredientes"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Prefixo da Senha (Opcional):</label>
                            <input
                              type="text"
                              value={editItemPrefix}
                              onChange={(e) => setEditItemPrefix(e.target.value)}
                              placeholder="Pp-"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 outline-none uppercase focus:border-amber-400"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedItem('pizza', flavor.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1 shadow"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={flavor.id}
                        className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">{flavor.name}</span>
                            {flavor.prefix && (
                              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                {flavor.prefix}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{flavor.description}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditItem(flavor)}
                            className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar sabor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemovePizzaFlavor(flavor.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="Remover sabor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO AÇAÍ */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <IceCream className="w-5 h-5 text-purple-400" />
                    <h3 className="font-extrabold text-white text-base">Cardápio de Açaí</h3>
                  </div>
                  <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-lg">
                    Prefixo Padrão: {acaiPrefix || 'A-'}
                  </span>
                </div>

                {/* FORMULÁRIO DE ADICIONAR COM PREÇO EM REAIS E MÁSCARA 0,00 */}
                <form onSubmit={handleAddAcai} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Opção (ex: Copo 400ml Especial)"
                    value={newAcaiName}
                    onChange={(e) => setNewAcaiName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                  />
                  
                  {/* PREÇO EM REAIS COM MÁSCARA 0,00 */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-purple-400">
                    <span className="bg-slate-800 text-purple-300 px-2.5 py-2 font-black text-xs border-r border-slate-700">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={newAcaiPrice}
                      onChange={(e) => setNewAcaiPrice(formatCurrencyMask(e.target.value))}
                      className="w-24 bg-transparent px-2.5 py-2 text-sm font-black text-white outline-none font-mono"
                    />
                  </div>

                  {/* PREFIXO DA SENHA PERSONALIZADA */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-purple-400">
                    <span className="bg-slate-800 text-purple-300 px-2 py-2 font-black text-[11px] border-r border-slate-700">
                      Senha:
                    </span>
                    <input
                      type="text"
                      placeholder="A-"
                      value={newAcaiPrefix}
                      onChange={(e) => setNewAcaiPrefix(e.target.value)}
                      className="w-16 bg-transparent px-2 py-2 text-xs font-mono font-bold text-purple-200 outline-none uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </form>

                {/* LISTAGEM DOS ITENS DE AÇAÍ COM MODO DE EDIÇÃO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {acaiCat?.items.map((item) => {
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900 p-3 rounded-xl border-2 border-purple-500 shadow-xl space-y-2 col-span-1"
                        >
                          <div className="text-[10px] font-black uppercase text-purple-400">
                            Editar Opção de Açaí
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Nome da Opção:</label>
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              placeholder="Nome do item"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-purple-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Preço (R$):</label>
                              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-purple-400">
                                <span className="text-[10px] text-purple-400 font-black mr-1">R$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editItemPrice}
                                  onChange={(e) => setEditItemPrice(formatCurrencyMask(e.target.value))}
                                  placeholder="0,00"
                                  className="w-full bg-transparent text-xs font-mono font-bold text-white outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Senha (Prefixo):</label>
                              <input
                                type="text"
                                value={editItemPrefix}
                                onChange={(e) => setEditItemPrefix(e.target.value)}
                                placeholder="A-"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-purple-300 outline-none uppercase focus:border-purple-400"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedItem('acai', item.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1 shadow"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate" title={item.name}>{item.name}</div>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            {/* PREÇO EM REAIS COM MÁSCARA 0,00 */}
                            <span className="text-xs font-black text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30 font-mono">
                              R$ {Number(item.price).toFixed(2).replace('.', ',')}
                            </span>

                            {/* PREFIXO DA SENHA */}
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              Senha: {item.prefix || acaiPrefix || 'A-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditItem(item)}
                            className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar opção (Nome, Preço e Senha)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveAcai(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="Remover opção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO BATATA FRITA */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-extrabold text-white text-base">Cardápio de Batata Frita</h3>
                  </div>
                  <span className="text-xs font-mono bg-yellow-950 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-lg">
                    Prefixo Padrão: {batataPrefix || 'B-'}
                  </span>
                </div>

                {/* FORMULÁRIO DE ADICIONAR COM PREÇO EM REAIS E MÁSCARA 0,00 */}
                <form onSubmit={handleAddBatata} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Opção (ex: Batata Rústica c/ Molho)"
                    value={newBatataName}
                    onChange={(e) => setNewBatataName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                  />
                  
                  {/* PREÇO EM REAIS COM MÁSCARA 0,00 */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-yellow-400">
                    <span className="bg-slate-800 text-yellow-300 px-2.5 py-2 font-black text-xs border-r border-slate-700">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={newBatataPrice}
                      onChange={(e) => setNewBatataPrice(formatCurrencyMask(e.target.value))}
                      className="w-24 bg-transparent px-2.5 py-2 text-sm font-black text-white outline-none font-mono"
                    />
                  </div>

                  {/* PREFIXO DA SENHA PERSONALIZADA */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-yellow-400">
                    <span className="bg-slate-800 text-yellow-300 px-2 py-2 font-black text-[11px] border-r border-slate-700">
                      Senha:
                    </span>
                    <input
                      type="text"
                      placeholder="B-"
                      value={newBatataPrefix}
                      onChange={(e) => setNewBatataPrefix(e.target.value)}
                      className="w-16 bg-transparent px-2 py-2 text-xs font-mono font-bold text-yellow-200 outline-none uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </form>

                {/* LISTAGEM DOS ITENS DE BATATA COM MODO DE EDIÇÃO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {batataCat?.items.map((item) => {
                    const isEditing = editingItemId === item.id;

                    if (isEditing) {
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900 p-3 rounded-xl border-2 border-yellow-500 shadow-xl space-y-2 col-span-1"
                        >
                          <div className="text-[10px] font-black uppercase text-yellow-400">
                            Editar Opção de Batata
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Nome da Opção:</label>
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              placeholder="Nome do item"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-yellow-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Preço (R$):</label>
                              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-yellow-400">
                                <span className="text-[10px] text-amber-400 font-black mr-1">R$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editItemPrice}
                                  onChange={(e) => setEditItemPrice(formatCurrencyMask(e.target.value))}
                                  placeholder="0,00"
                                  className="w-full bg-transparent text-xs font-mono font-bold text-white outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Senha (Prefixo):</label>
                              <input
                                type="text"
                                value={editItemPrefix}
                                onChange={(e) => setEditItemPrefix(e.target.value)}
                                placeholder="B-"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-yellow-300 outline-none uppercase focus:border-yellow-400"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={handleCancelEditItem}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedItem('batata', item.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1 shadow"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate" title={item.name}>{item.name}</div>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            {/* PREÇO EM REAIS COM MÁSCARA 0,00 */}
                            <span className="text-xs font-black text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/30 font-mono">
                              R$ {Number(item.price).toFixed(2).replace('.', ',')}
                            </span>

                            {/* PREFIXO DA SENHA */}
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              Senha: {item.prefix || batataPrefix || 'B-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditItem(item)}
                            className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar opção (Nome, Preço e Senha)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveBatata(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="Remover opção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              ABA HISTÓRICO: TURNOS ENCERRADOS, AUDITORIA E COMANDAS
             ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              
              {/* CABEÇALHO DO HISTÓRICO COM ZERAR / FECHAR TURNO */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <Archive className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                      CENTRAL DE HISTÓRICO & AUDITORIA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cópias completas de turnos arquivados, comandas de hoje e auditoria de vendas excluídas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-black text-xs rounded-xl border border-rose-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Zerar / Fechar Turno</span>
                </button>
              </div>

              {/* SEÇÃO 1: TURNOS ARQUIVADOS NO HISTÓRICO (CÓPIAS SALVAS) */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Archive className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">
                        Cópias Salvas de Turnos Arquivados
                      </h4>
                      <p className="text-xs text-slate-400">
                        Cada vez que o caixa é zerado, uma cópia completa com todos os pedidos é preservada aqui.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40">
                    {turnoHistory.length} turno(s) arquivado(s)
                  </span>
                </div>

                {turnoHistory.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs italic">
                    Nenhum turno anterior arquivado ainda. Ao clicar em "Zerar / Fechar Turno", uma cópia será guardada aqui automaticamente.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {turnoHistory.map((hist) => (
                      <div key={hist.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-amber-300">
                              {hist.event?.name || 'Cantina Geral'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              📅 {hist.archivedAtFormatted || new Date(hist.archivedAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {hist.totalOrders} pedidos arquivados • PIX: R$ {(hist.paymentBreakdown?.pix || 0).toFixed(2)} • Dinheiro: R$ {(hist.paymentBreakdown?.dinheiro || 0).toFixed(2)} • Cartões: R$ {((hist.paymentBreakdown?.debito || 0) + (hist.paymentBreakdown?.credito || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Faturamento do Turno</div>
                          <div className="text-sm font-black text-emerald-400 font-mono">
                            R$ {(hist.totalRevenue || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: HISTÓRICO E AUDITORIA DE TODAS AS VENDAS DE HOJE */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                  <div>
                    <h4 className="font-extrabold text-white text-base">
                      Histórico de Vendas de Hoje (Auditoria)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Visualize todos os pedidos do turno atual. Vendas excluídas ficam esmaecidas com [EXCLUÍDO] e não somam no faturamento.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold">Total Faturado: </span>
                    <span className="text-sm font-black text-emerald-400 font-mono">R$ {totalGeral.toFixed(2)}</span>
                  </div>
                </div>

                {/* CARDS TOTALIZADORES */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total Geral</div>
                    <div className="text-base font-black text-emerald-400 font-mono">R$ {totalGeral.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400">{activeOrders.length} ativas</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase">PIX</div>
                    <div className="text-sm font-black text-white font-mono">R$ {totalPix.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-teal-400 uppercase">Dinheiro</div>
                    <div className="text-sm font-black text-white font-mono">R$ {totalDinheiro.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-blue-400 uppercase">Cartões</div>
                    <div className="text-sm font-black text-white font-mono">R$ {(totalDebito + totalCredito).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-rose-400 uppercase">Excluídas</div>
                    <div className="text-sm font-black text-rose-300 font-mono">{todayOrders.length - activeOrders.length}</div>
                  </div>
                </div>

                {/* TABELA COMPLETA COM STATUS, EXCLUÍDOS EM ESMAECIDO E RESTAURAR */}
                <div className="border border-slate-700/80 rounded-xl overflow-hidden mt-2">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[10px] tracking-wider z-10">
                        <tr>
                          <th className="p-2.5">Comanda</th>
                          <th className="p-2.5">Cliente</th>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Qtde</th>
                          <th className="p-2.5">Pagamento</th>
                          <th className="p-2.5 text-right">Valor</th>
                          <th className="p-2.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {todayOrders.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-slate-500 italic">
                              Nenhuma venda registrada no turno atual.
                            </td>
                          </tr>
                        ) : (
                          todayOrders.map((ord) => {
                            const isCancelled = ord.status === 'cancelado';
                            return (
                              <tr 
                                key={ord.id} 
                                className={`transition-colors ${
                                  isCancelled 
                                    ? 'opacity-40 bg-slate-950/80 text-slate-500 line-through select-none' 
                                    : 'hover:bg-slate-800/40'
                                }`}
                              >
                                <td className="p-2.5 font-mono font-bold text-orange-400">{ord.orderNumber}</td>
                                <td className="p-2.5 font-bold text-white">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                                      {ord.customerName}
                                    </span>
                                    {isCancelled && (
                                      <span className="no-underline text-[9px] font-black uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded shadow-sm inline-block">
                                        EXCLUÍDO
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2.5">{ord.fullDescription || ord.itemName}</td>
                                <td className="p-2.5">{ord.quantity}x</td>
                                <td className="p-2.5">{ord.paymentMethod}</td>
                                <td className={`p-2.5 text-right font-bold ${isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                  R$ {Number(ord.totalPrice).toFixed(2)}
                                </td>
                                <td className="p-2.5 text-center no-underline">
                                  {isCancelled ? (
                                    <button
                                      onClick={() => handleRestoreOrder(ord.id)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] rounded-lg border border-slate-700 inline-flex items-center gap-1 shadow-sm no-underline cursor-pointer"
                                      title="Restaurar venda de volta ao faturamento do caixa"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Restaurar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenCancelConfirm(ord)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                      title="Excluir venda do faturamento (permanece no histórico esmaecida)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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

              {/* SEÇÃO 3: HISTÓRICO DE EVENTOS REALIZADOS */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-white text-sm">
                      Histórico de Eventos da Cantina
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {eventsList.length} evento(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {eventsList.map(evt => (
                    <div key={evt.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{evt.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{evt.date || 'Hoje'}</div>
                      </div>
                      {currentEvent?.id === evt.id && (
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                          Ativo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
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
            <div className="space-y-6">
              
              {/* SEÇÃO 1: GESTÃO DO EVENTO ATIVO */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/50 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                          EVENTO ATIVO:
                        </h3>
                        <span className="text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow">
                          {currentEvent?.name || 'Cantina Geral'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Data: <span className="text-slate-200 font-medium">{currentEvent?.date || new Date().toISOString().split('T')[0]}</span> • Vendas do caixa são vinculadas ao evento ativo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {eventsList.length > 1 && (
                      <select
                        value={currentEvent?.id || ''}
                        onChange={(e) => handleSelectEvent(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                        title="Alternar entre eventos já cadastrados"
                      >
                        {eventsList.map(evt => (
                          <option key={evt.id} value={evt.id}>
                            {evt.name} ({evt.date || 'Hoje'})
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowNewEventForm(!showNewEventForm)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showNewEventForm ? 'Fechar' : 'Criar Novo Evento'}</span>
                    </button>
                  </div>
                </div>

                {/* FORMULÁRIO PARA CRIAR NOVO EVENTO */}
                {showNewEventForm && (
                  <form onSubmit={handleCreateEvent} className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/40 space-y-3 animate-fadeIn">
                    <div className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <CalendarPlus className="w-4 h-4" />
                      <span>Cadastrar Novo Evento da Cantina</span>
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
                )}
              </div>

              {/* SEÇÃO 2: RESUMO DE VENDAS DE HOJE */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base">Resumo de Vendas de Hoje</h3>
                    <p className="text-xs text-slate-400">
                      {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {turnoHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistoryList(!showHistoryList)}
                        className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                          showHistoryList 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Ver turnos encerrados arquivados anteriormente"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                        <span>Histórico ({turnoHistory.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenResetModal}
                      className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Zerar comandas e guardar cópia completa no histórico"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Zerar / Fechar Turno
                    </button>
                  </div>
                </div>

                {/* PAINEL SANFONA COM OS TURNOS ARQUIVADOS NO HISTÓRICO */}
                {showHistoryList && (
                  <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                          Cópias Salvas no Histórico de Turnos
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {turnoHistory.length} turno(s) arquivado(s)
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {turnoHistory.map((hist) => (
                        <div key={hist.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-amber-300">
                                {hist.event?.name || 'Cantina Geral'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                📅 {hist.archivedAtFormatted || new Date(hist.archivedAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {hist.totalOrders} pedidos arquivados • PIX: R$ {(hist.paymentBreakdown?.pix || 0).toFixed(2)} • Dinheiro: R$ {(hist.paymentBreakdown?.dinheiro || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Total Arquivado</div>
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              R$ {(hist.totalRevenue || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARDS COM TOTALIZADORES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Total Geral</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">R$ {totalGeral.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">
                      {activeOrders.length} vendas ativas
                      {todayOrders.length - activeOrders.length > 0 && (
                        <span className="text-rose-400 font-bold ml-1">
                          ({todayOrders.length - activeOrders.length} excluídas)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase">PIX</div>
                    <div className="text-lg font-black text-white mt-1">R$ {totalPix.toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-teal-400 uppercase">Dinheiro</div>
                    <div className="text-lg font-black text-white mt-1">R$ {totalDinheiro.toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-blue-400 uppercase">Débito</div>
                    <div className="text-lg font-black text-white mt-1">R$ {totalDebito.toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase">Crédito</div>
                    <div className="text-lg font-black text-white mt-1">R$ {totalCredito.toFixed(2)}</div>
                  </div>
                </div>

                {/* TABELA DE PEDIDOS DE HOJE COM HISTÓRICO ESMAECIDO E EXCLUSÃO DE VENDAS */}
                <div className="border border-slate-700/80 rounded-xl overflow-hidden mt-4">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[10px] tracking-wider z-10">
                        <tr>
                          <th className="p-2.5">Comanda</th>
                          <th className="p-2.5">Cliente</th>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Qtde</th>
                          <th className="p-2.5">Pagamento</th>
                          <th className="p-2.5 text-right">Valor</th>
                          <th className="p-2.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {todayOrders.map((ord) => {
                          const isCancelled = ord.status === 'cancelado';
                          return (
                            <tr 
                              key={ord.id} 
                              className={`transition-colors ${
                                isCancelled 
                                  ? 'opacity-40 bg-slate-950/80 text-slate-500 line-through select-none' 
                                  : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="p-2.5 font-mono font-bold text-orange-400">{ord.orderNumber}</td>
                              <td className="p-2.5 font-bold text-white">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                                    {ord.customerName}
                                  </span>
                                  {isCancelled && (
                                    <span className="no-underline text-[9px] font-black uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded shadow-sm inline-block">
                                      EXCLUÍDO
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5">{ord.fullDescription || ord.itemName}</td>
                              <td className="p-2.5">{ord.quantity}x</td>
                              <td className="p-2.5">{ord.paymentMethod}</td>
                              <td className={`p-2.5 text-right font-bold ${isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                R$ {Number(ord.totalPrice).toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center no-underline">
                                {isCancelled ? (
                                  <button
                                    onClick={() => handleRestoreOrder(ord.id)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] rounded-lg border border-slate-700 inline-flex items-center gap-1 shadow-sm no-underline cursor-pointer"
                                    title="Restaurar venda de volta ao faturamento do caixa"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Restaurar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenCancelConfirm(ord)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Excluir venda do faturamento (permanece no histórico esmaecida)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {todayOrders.length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-6 text-center text-slate-500 text-xs italic">
                              Nenhuma venda registrada hoje.
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
              ABA 4: CONFIGURAÇÃO DO PAINEL TV
             ========================================================= */}
          {activeTab === 'tv' && (
            <div className="space-y-6">
              
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                  <Tv className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-white text-base">Configuração de Exibição do Painel TV</h3>
                    <p className="text-xs text-slate-400">Defina aqui o que a TV do público irá exibir e como irá se comportar</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  
                  {/* TOGGLE 1: SOM NA TV */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">Alarme Sonoro de Chamada na TV</div>
                      <div className="text-xs text-slate-400 mt-0.5">Toca o Ding-Dong sonoro na TV quando a cozinha marcar um pedido como pronto</div>
                    </div>
                    <button
                      onClick={handleToggleTVSound}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        tvSettings.soundEnabled
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tvSettings.soundEnabled ? '✓ Som Ativado' : '✕ Mudo / Desativado'}
                    </button>
                  </div>

                  {/* TOGGLE 2: EXIBIR PEDIDOS ENTREGUES */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">Exibir Coluna de Pedidos Entregues</div>
                      <div className="text-xs text-slate-400 mt-0.5">Mostra a lista com os últimos pedidos retirados. Se desmarcar, a TV fica 100% focada em EM PREPARAÇÃO</div>
                    </div>
                    <button
                      onClick={handleToggleTVDelivered}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        tvSettings.showDelivered
                          ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tvSettings.showDelivered ? '✓ Exibir Entregues' : '✕ Apenas Em Preparação'}
                    </button>
                  </div>

                  {/* TOGGLE 3: ABRIR EM TELA CHEIA AUTOMATICAMENTE */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">Abrir Automaticamente em Tela Cheia</div>
                      <div className="text-xs text-slate-400 mt-0.5">Tenta colocar a TV em fullscreen automaticamente ao carregar a página</div>
                    </div>
                    <button
                      onClick={handleToggleTVFullscreen}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        tvSettings.autoFullscreen
                          ? 'bg-purple-600 text-white border-purple-400 shadow-lg'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tvSettings.autoFullscreen ? '✓ Fullscreen Auto' : '✕ Desativado'}
                    </button>
                  </div>

                  {/* TOGGLE 4: AVISOS SONOROS NA COZINHA */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">Avisos Sonoros da Cozinha</div>
                      <div className="text-xs text-slate-400 mt-0.5">Toca o alarme sonoro na cozinha a cada novo pedido enviado pelo caixa</div>
                    </div>
                    <button
                      onClick={handleToggleKitchenSound}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        kitchenSettings.soundEnabled
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {kitchenSettings.soundEnabled ? '✓ Som Ativado' : '✕ Mudo / Desativado'}
                    </button>
                  </div>

                  {/* SEÇÃO LIMPEZA DE FILA E CACHE DA COZINHA E PAINEL */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                    <div>
                      <div className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Limpar Fila / Cache da Cozinha e Painel TV</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Apaga todos os pedidos da fila ativa da Cozinha e do Painel TV, limpando o cache local.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClearQueueModal(true)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 border border-rose-400/50"
                      title="Apaga os pedidos da fila ativa e limpa o cache"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Limpar Fila / Cache</span>
                    </button>
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
                    O sistema guardará uma <strong>cópia completa de segurança</strong> de todas as <strong>{todayOrders.length} vendas</strong> (R$ {totalGeral.toFixed(2)}) e do evento ativo <strong>"{currentEvent?.name || 'Cantina Geral'}"</strong> no histórico permanente.
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
                    As filas de pedidos do <strong>Caixa</strong>, <strong>Cozinha KDS</strong> e <strong>Painel TV</strong> serão zeradas para que você inicie o próximo turno com tela limpa.
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
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Item: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Copo Açaí 400ml, Refrigerante Lata, Pastel de Queijo..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Categoria: *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      setNewItemCategory(e.target.value);
                      if (e.target.value === 'acai') setNewItemPrefix('A-');
                      else if (e.target.value === 'batata') setNewItemPrefix('B-');
                      else if (e.target.value === 'pizza') setNewItemPrefix('Pp-');
                      else setNewItemPrefix('Ped-');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="acai">Açaí</option>
                    <option value="batata">Batata Frita</option>
                    <option value="pizza">Pizza</option>
                    <option value="outros">Outros / Bebidas</option>
                  </select>
                </div>

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
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(formatCurrencyMask(e.target.value))}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Descrição / Detalhes:
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional (ex: 350ml gelada)"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                  />
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
            className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 text-slate-100 relative cursor-default"
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
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGearModal} className="space-y-3.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Prefixo da Senha / Comanda: * <span className="text-[10px] text-slate-400 font-normal">(Maiúsculo/Minúsculo)</span>
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
                    Preço de Venda (R$): *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-amber-400">
                    <span className="text-xs font-bold text-emerald-400 mr-1.5">R$</span>
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
                    <span className="font-black text-rose-400 text-sm">R$ {(cancelConfirmModal.order.totalPrice || 0).toFixed(2)}</span>
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

      {/* MODAL BONITO RÁPIDO (1 SEGUNDO) */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={1000} />

    </div>
  );
}
