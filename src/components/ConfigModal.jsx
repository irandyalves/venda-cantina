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
  Tv
} from 'lucide-react';
import { storageService } from '../services/storage';
import { authService, PERFIS } from '../services/auth';
import { DEFAULT_CATEGORIES } from '../data/defaultProducts';

export default function ConfigModal({ isOpen, onClose, initialTab = 'products' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'products', 'firebase', 'reports', 'emails'
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  
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

  // Estado Novo Sabor de Pizza
  const [newPizzaFlavor, setNewPizzaFlavor] = useState('');
  const [newPizzaDesc, setNewPizzaDesc] = useState('');

  // Estado Novo Item de Açaí
  const [newAcaiName, setNewAcaiName] = useState('');
  const [newAcaiPrice, setNewAcaiPrice] = useState('');

  // Estado Novo Item de Batata
  const [newBatataName, setNewBatataName] = useState('');
  const [newBatataPrice, setNewBatataPrice] = useState('');

  // Preços de pizza (Pedaço e Inteira)
  const [pedacoPrice, setPedacoPrice] = useState(9);
  const [inteiraPrice, setInteiraPrice] = useState(48);

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
      if (p) setPedacoPrice(p.price);
      if (i) setInteiraPrice(i.price);
    }

    const savedFb = storageService.getFirebaseConfig();
    if (savedFb) {
      setFirebaseConfig(savedFb);
      setFirebaseStatus({ success: true, message: 'Configuração conectada ao Firebase.' });
    }

    setEmailRules(authService.getEmailRules());
    setOrders(storageService.getLocalOrders());
  };

  if (!isOpen) return null;

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

  // --- AÇÕES DE PRODUTOS ---
  const handleSavePizzaPrices = () => {
    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        return {
          ...cat,
          variations: [
            { id: 'pedaco', name: 'PEDAÇO', price: parseFloat(pedacoPrice) || 0, prefix: 'P ped-' },
            { id: 'inteira', name: 'INTEIRA', price: parseFloat(inteiraPrice) || 0, prefix: 'P int-' },
          ]
        };
      }
      return cat;
    });
    storageService.saveProducts(updated);
    setCategories(updated);
    alert('Preços da Pizza atualizados!');
  };

  const handleAddPizzaFlavor = (e) => {
    e.preventDefault();
    if (!newPizzaFlavor.trim()) return;

    const updated = categories.map(cat => {
      if (cat.id === 'pizza') {
        const newItem = {
          id: 'p_' + Date.now(),
          name: newPizzaFlavor.trim(),
          description: newPizzaDesc.trim() || 'Sabor especial'
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewPizzaFlavor('');
    setNewPizzaDesc('');
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
  };

  const handleAddAcai = (e) => {
    e.preventDefault();
    if (!newAcaiName.trim() || !newAcaiPrice) return;

    const updated = categories.map(cat => {
      if (cat.id === 'acai') {
        const newItem = {
          id: 'acai_' + Date.now(),
          name: newAcaiName.trim(),
          price: parseFloat(newAcaiPrice) || 0,
          prefix: 'Açaí '
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewAcaiName('');
    setNewAcaiPrice('');
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
  };

  const handleAddBatata = (e) => {
    e.preventDefault();
    if (!newBatataName.trim() || !newBatataPrice) return;

    const updated = categories.map(cat => {
      if (cat.id === 'batata') {
        const newItem = {
          id: 'bat_' + Date.now(),
          name: newBatataName.trim(),
          price: parseFloat(newBatataPrice) || 0,
          prefix: 'Bat '
        };
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    storageService.saveProducts(updated);
    setCategories(updated);
    setNewBatataName('');
    setNewBatataPrice('');
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
  };

  // Atualizar preço de qualquer item individualmente (Açaí ou Batata)
  const handleUpdateItemPrice = (categoryId, itemId, newPrice) => {
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

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
  };

  const handleResetCatalog = () => {
    if (window.confirm('Tem certeza que deseja restaurar o cardápio padrão com os sabores iniciais?')) {
      storageService.saveProducts(DEFAULT_CATEGORIES);
      setCategories(DEFAULT_CATEGORIES);
      alert('Cardápio restaurado com sucesso!');
    }
  };

  // --- AÇÕES DO FIREBASE ---
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    try {
      const ok = storageService.saveFirebaseConfig(firebaseConfig);
      if (ok) {
        setFirebaseStatus({ success: true, message: 'Firebase conectado com sucesso!' });
      } else {
        setFirebaseStatus({ success: false, message: 'Dados salvos, mas verifique se o Project ID e API Key estão corretos.' });
      }
    } catch (err) {
      setFirebaseStatus({ success: false, message: err.message });
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

  const handleClearDay = () => {
    if (window.confirm('ATENÇÃO: Deseja zerar as comandas e fechar o turno de hoje?')) {
      storageService.clearDayOrders();
      setOrders([]);
      alert('Comandas zeradas para o novo turno!');
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

                {/* DEFINIR PREÇOS DE PEDAÇO E INTEIRA */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 uppercase">Preço Pedaço (R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={pedacoPrice}
                        onChange={(e) => setPedacoPrice(e.target.value)}
                        className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 font-bold text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-red-400 uppercase">Preço Inteira (R$)</label>
                      <input
                        type="number"
                        step="1"
                        value={inteiraPrice}
                        onChange={(e) => setInteiraPrice(e.target.value)}
                        className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 font-bold text-white outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSavePizzaPrices}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Salvar Preços de Pizza
                  </button>
                </div>

                {/* ADICIONAR NOVO SABOR DE PIZZA */}
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
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Sabor
                  </button>
                </form>

                {/* LISTA DOS SABORES ATUAIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                  {pizzaCat?.items.map((flavor) => (
                    <div
                      key={flavor.id}
                      className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{flavor.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{flavor.description}</div>
                      </div>
                      <button
                        onClick={() => handleRemovePizzaFlavor(flavor.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remover sabor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO AÇAÍ */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                  <IceCream className="w-5 h-5 text-purple-400" />
                  <h3 className="font-extrabold text-white text-base">Cardápio de Açaí</h3>
                </div>

                <form onSubmit={handleAddAcai} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Opção (ex: Copo 400ml Especial)"
                    value={newAcaiName}
                    onChange={(e) => setNewAcaiName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Preço R$"
                    value={newAcaiPrice}
                    onChange={(e) => setNewAcaiPrice(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {acaiCat?.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-xs text-white truncate">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-purple-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            defaultValue={item.price}
                            onBlur={(e) => handleUpdateItemPrice('acai', item.id, e.target.value)}
                            className="w-16 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs font-bold text-white outline-none focus:border-purple-400"
                            title="Altere o valor e saia do campo para salvar"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAcai(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remover opção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO BATATA FRITA */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                  <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-extrabold text-white text-base">Cardápio de Batata Frita</h3>
                </div>

                <form onSubmit={handleAddBatata} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Opção (ex: Batata Rústica c/ Molho)"
                    value={newBatataName}
                    onChange={(e) => setNewBatataName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Preço R$"
                    value={newBatataPrice}
                    onChange={(e) => setNewBatataPrice(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {batataCat?.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-xs text-white truncate">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-amber-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            defaultValue={item.price}
                            onBlur={(e) => handleUpdateItemPrice('batata', item.id, e.target.value)}
                            className="w-16 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs font-bold text-white outline-none focus:border-amber-400"
                            title="Altere o valor e saia do campo para salvar"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBatata(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remover opção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <p className="font-bold text-amber-300 mb-1">Status da Nuvem:</p>
                  <p className="text-slate-400">
                    O projeto está conectado ao Firebase <strong>cantina-express-32161</strong> no Firebase Hosting.
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

        </div>

      </div>

    </div>
  );
}
