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
  Check
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

  // Preços de pizza (Pedaço e Inteira com máscara 0,00)
  const [pedacoPrice, setPedacoPrice] = useState('9,00');
  const [inteiraPrice, setInteiraPrice] = useState('48,00');

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab]);

  const loadData = () => {
    const cats = storageService.getProducts();
    setCategories(cats);

    const pizzaCat = cats.find(c => c.id === 'pizza');
    if (pizzaCat && pizzaCat.variations) {
      const p = pizzaCat.variations.find(v => v.id === 'pedaco');
      const i = pizzaCat.variations.find(v => v.id === 'inteira');
      if (p) {
        setPedacoPrice(formatCurrencyMask(p.price));
        setPedacoPrefix(p.prefix || 'Pp-');
      }
      if (i) {
        setInteiraPrice(formatCurrencyMask(i.price));
        setInteiraPrefix(i.prefix || 'Pi-');
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
    setOrders(storageService.getLocalOrders());
  };

  if (!isOpen) return null;

  // --- AÇÕES DE CONFIGURAÇÃO DA TV ---
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

  // --- AÇÕES DE PRODUTOS E PREFIXOS ---

  // Salvar Prefixos Globais das Comandas (Pp-, Pi-, A-, B-)
  const handleSaveAllPrefixes = () => {
    const pPed = pedacoPrefix.trim() || 'Pp-';
    const pInt = inteiraPrefix.trim() || 'Pi-';
    const aPref = acaiPrefix.trim() || 'A-';
    const bPref = batataPrefix.trim() || 'B-';

    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        return {
          ...cat,
          variations: (cat.variations || []).map(v => {
            if (v.id === 'pedaco') return { ...v, prefix: pPed };
            if (v.id === 'inteira') return { ...v, prefix: pInt };
            return v;
          })
        };
      }
      if (cat.id === 'acai') {
        return {
          ...cat,
          prefixDefault: aPref,
          items: (cat.items || []).map(it => ({ ...it, prefix: it.prefix || aPref }))
        };
      }
      if (cat.id === 'batata') {
        return {
          ...cat,
          prefixDefault: bPref,
          items: (cat.items || []).map(it => ({ ...it, prefix: it.prefix || bPref }))
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Prefixos das senhas atualizados com sucesso!', 'Prefixos Salvos');
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

  // Atualizar preço individualmente (Açaí ou Batata)
  const handleUpdateItemPrice = (categoryId, itemId, newPrice) => {
    const priceNum = parsePrice(newPrice);

    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, price: priceNum } : item)
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    showToast('Preço do item atualizado com sucesso!');
  };

  // Atualizar prefixo da senha de um item individualmente
  const handleUpdateItemPrefix = (categoryId, itemId, newPrefix) => {
    const cleanPref = (newPrefix || '').trim();
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, prefix: cleanPref } : item)
        };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    showToast(`Prefixo da senha alterado para "${cleanPref}"!`, 'Senha Personalizada');
  };

  const handleResetCatalog = () => {
    if (window.confirm('Tem certeza que deseja restaurar o cardápio padrão com os sabores e prefixos iniciais?')) {
      storageService.saveProducts(DEFAULT_CATEGORIES);
      setCategories(DEFAULT_CATEGORIES);
      loadData();
      showToast('Cardápio restaurado com sucesso!', 'Cardápio Padrão');
    }
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

  // --- AÇÕES DO FECHAMENTO DE CAIXA ---
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

  const totalGeral = todayOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalPix = todayOrders.filter(o => o.paymentMethod === 'PIX').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDinheiro = todayOrders.filter(o => o.paymentMethod === 'DINHEIRO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalDebito = todayOrders.filter(o => o.paymentMethod === 'DEBITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const totalCredito = todayOrders.filter(o => o.paymentMethod === 'CREDITO').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const handleClearDay = async () => {
    if (window.confirm('ATENÇÃO: Deseja zerar todas as comandas e limpar o cache da Cozinha e do Painel TV? Isso removerá todos os pedidos antigos do sistema.')) {
      await storageService.clearAllOrders();
      setOrders([]);
      showToast('Cache e pedidos limpos com sucesso na Cozinha e TV!', 'Limpeza Concluída');
    }
  };

  const pizzaCat = categories.find(c => c.id === 'pizza');
  const acaiCat = categories.find(c => c.id === 'acai');
  const batataCat = categories.find(c => c.id === 'batata');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
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
            <span>Cardápio & Sabores</span>
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
            <span>Configuração TV</span>
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
                  NOVO: PAINEL DE DEFINIÇÃO DOS PREFIXOS DAS SENHAS
                 ======================================================== */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-2xl border-2 border-amber-500/50 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Tag className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                        PREFIXOS DAS SENHAS (COMANDAS)
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                          Personalizável
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Defina a sigla das senhas geradas no caixa para a cozinha e TV. Ex: Pp-01, Pi-02, A-01, B-01.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllPrefixes}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Save className="w-4 h-4" /> Salvar Prefixos
                  </button>
                </div>

                {/* GRID DOS 4 PREFIXOS PADRÕES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* PIZZA PEDAÇO */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-400 uppercase">Pizza Pedaço</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ex: {pedacoPrefix || 'Pp-'}01</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={pedacoPrefix}
                        onChange={(e) => setPedacoPrefix(e.target.value)}
                        placeholder="Pp-"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-amber-300 outline-none focus:border-amber-400 uppercase"
                      />
                    </div>
                  </div>

                  {/* PIZZA INTEIRA */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-red-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-red-400 uppercase">Pizza Inteira</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ex: {inteiraPrefix || 'Pi-'}01</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={inteiraPrefix}
                        onChange={(e) => setInteiraPrefix(e.target.value)}
                        placeholder="Pi-"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-red-300 outline-none focus:border-red-400 uppercase"
                      />
                    </div>
                  </div>

                  {/* AÇAÍ */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-purple-400 uppercase">Açaí (Padrão)</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ex: {acaiPrefix || 'A-'}01</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={acaiPrefix}
                        onChange={(e) => setAcaiPrefix(e.target.value)}
                        placeholder="A-"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-purple-300 outline-none focus:border-purple-400 uppercase"
                      />
                    </div>
                  </div>

                  {/* BATATA FRITA */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-yellow-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-yellow-400 uppercase">Batata (Padrão)</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ex: {batataPrefix || 'B-'}01</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={batataPrefix}
                        onChange={(e) => setBatataPrefix(e.target.value)}
                        placeholder="B-"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-yellow-300 outline-none focus:border-yellow-400 uppercase"
                      />
                    </div>
                  </div>

                </div>
              </div>
              
              {/* SEÇÃO PIZZA: PREÇOS E SABORES */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Pizza className="w-5 h-5 text-red-400" />
                    <h3 className="font-extrabold text-white text-base">Configurações de Pizza</h3>
                  </div>
                  <button
                    onClick={handleResetCatalog}
                    className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões
                  </button>
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
              
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base">Resumo de Vendas de Hoje</h3>
                    <p className="text-xs text-slate-400">{new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                  </div>
                  <button
                    onClick={handleClearDay}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-rose-500/40 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Zerar / Fechar Turno
                  </button>
                </div>

                {/* CARDS COM TOTALIZADORES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Total Geral</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">R$ {totalGeral.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">{todayOrders.length} vendas</div>
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

                {/* TABELA DE PEDIDOS DE HOJE */}
                <div className="border border-slate-700/80 rounded-xl overflow-hidden mt-4">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-2.5">Comanda</th>
                          <th className="p-2.5">Cliente</th>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Qtde</th>
                          <th className="p-2.5">Pagamento</th>
                          <th className="p-2.5 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {todayOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono font-bold text-orange-400">{ord.orderNumber}</td>
                            <td className="p-2.5 font-bold text-white">{ord.customerName}</td>
                            <td className="p-2.5">{ord.fullDescription || ord.itemName}</td>
                            <td className="p-2.5">{ord.quantity}x</td>
                            <td className="p-2.5">{ord.paymentMethod}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-400">R$ {Number(ord.totalPrice).toFixed(2)}</td>
                          </tr>
                        ))}
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

                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL BONITO DE 2 SEGUNDOS */}
      <AutoToast toast={toast} onClose={() => setToast(null)} duration={2000} />

    </div>
  );
}
