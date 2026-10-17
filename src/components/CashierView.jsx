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
  ShoppingCart
} from 'lucide-react';
import { storageService } from '../services/storage';
import ProfileSelector from './ProfileSelector';
import AutoToast from './AutoToast';

export default function CashierView({ onOpenConfig, onNavigate }) {
  // Estado do Caixa
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);

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

  // Carregar produtos e escutar pedidos em tempo real
  useEffect(() => {
    setCategories(storageService.getProducts());

    const unsubscribeOrders = storageService.subscribeOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubscribeStatus = storageService.onConnectionStatusChange((status) => {
      setIsFirebaseOnline(status);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeStatus();
    };
  }, []);

  // Quando um produto é selecionado, dá foco automático no campo de nome
  useEffect(() => {
    if (selectedProduct && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [selectedProduct]);

  // Totais do rodapé
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const countEmPreparo = todayOrders.filter(o => o.status === 'em_preparo').length;
  const countProntas = todayOrders.filter(o => o.status === 'pronto').length;
  const countEntregues = todayOrders.filter(o => o.status === 'entregue').length;
  const totalFaturado = todayOrders.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  // 1º PASSO: Selecionar o produto
  const handleSelectPizzaVariation = (flavor, variation) => {
    setSelectedProduct({
      category: categories.find(c => c.id === 'pizza'),
      item: flavor,
      variation: variation
    });
  };

  const handleSelectDirectItem = (category, item) => {
    setSelectedProduct({
      category,
      item,
      variation: null
    });
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
      description = `Pizza ${variation.name}: ${item.name}`;
    } else if (category.id === 'acai') {
      prefix = item.prefix || category.prefixDefault || 'A-';
      description = `Açaí ${item.name}`;
    } else if (category.id === 'batata') {
      prefix = item.prefix || category.prefixDefault || 'B-';
      description = `Batata ${item.name}`;
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
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              CANTINA EXPRESS <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/30">CAIXA PDV</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">Escolha o produto ➔ Preencha o nome ➔ Envie</div>
          </div>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex items-center gap-1.5">
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
            isFirebaseOnline 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' 
              : 'bg-amber-950/60 text-amber-300 border-amber-600/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isFirebaseOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>{isFirebaseOnline ? 'Nuvem Realtime' : 'Modo Local'}</span>
          </div>

          <button 
            onClick={() => onNavigate('kitchen')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden md:inline">Cozinha KDS</span>
          </button>

          <button 
            onClick={() => onNavigate('display')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Painel TV</span>
          </button>

          {/* BOTÃO DA ENGRENAGEM (CONFIGURAÇÕES DO CAIXA) */}
          <button 
            onClick={() => onOpenConfig()}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-sm active:scale-95 border border-amber-500"
            title="Configurações, Cadastro de Produtos, Preços e Fechamento de Caixa"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden lg:inline">CONFIGURAÇÕES ⚙️</span>
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
      <div className="px-3 pt-2.5 shrink-0">
        {selectedProduct ? (
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-3 border-2 border-emerald-500 shadow-2xl animate-fadeIn space-y-2.5">
            
            {/* LINHA DE RESUMO DO PRODUTO ESCOLHIDO */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-xs uppercase font-extrabold text-slate-400">Item Selecionado:</span>
                <span className="text-sm font-black text-amber-300">
                  {selectedProduct.category.id === 'pizza'
                    ? `Pizza ${selectedProduct.variation?.name}: ${selectedProduct.item.name}`
                    : `${selectedProduct.category.name} — ${selectedProduct.item.name}`}
                </span>
                <span className="text-xs font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  R$ {((selectedProduct.variation?.price || selectedProduct.item.price || 0) * quantity).toFixed(2)}
                </span>
              </div>

              <button
                onClick={cancelSelection}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 bg-slate-800 hover:bg-slate-750 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                title="Trocar item ou cancelar seleção"
              >
                <X className="w-3.5 h-3.5" />
                <span>Trocar Item</span>
              </button>
            </div>

            {/* FORMULÁRIO COM NOME, QUANTIDADE, PAGAMENTO E O BOTÃO VERDE ENVIAR */}
            <form onSubmit={handleConfirmAndSend} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              
              {/* CAMPO DO NOME (OBRIGATÓRIO COM BORDA VERMELHA SE VAZIO) */}
              <div className="sm:col-span-5 flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isNameFilled ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                    <span>Nome de quem comprou *</span>
                  </label>
                  {!isNameFilled ? (
                    <span className="text-[10px] text-rose-300 font-extrabold bg-rose-950/70 px-1.5 py-0.2 rounded border border-rose-500/60 animate-pulse">
                      ⚠️ Obrigatório
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-300 font-bold">✓ Preenchido</span>
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
                    className={`w-full bg-slate-950 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none transition-all placeholder:text-slate-500 placeholder:font-normal border-2 ${
                      !isNameFilled 
                        ? 'border-rose-500 glow-required-name' 
                        : 'border-emerald-500 ring-1 ring-emerald-500/40'
                    }`}
                  />
                </div>
              </div>

              {/* CAMPO DE QUANTIDADE */}
              <div className="sm:col-span-2 flex flex-col gap-0.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Quantidade
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-700">
                  <button 
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded flex items-center justify-center"
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
                    className="w-full text-center bg-transparent text-sm font-black text-amber-300 outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* FORMA DE PAGAMENTO */}
              <div className="sm:col-span-2 flex flex-col gap-0.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs py-1.5 px-2 rounded-lg outline-none focus:border-amber-400"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>

              {/* BOTÃO VERDE ENVIAR */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-emerald-300"
                >
                  <Send className="w-4 h-4 fill-current" />
                  <span>ENVIAR PARA COZINHA</span>
                </button>
              </div>

            </form>

            {showNameError && (
              <div className="text-[11px] text-rose-300 font-bold bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/50 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Por favor, digite o nome de quem comprou para enviar para a cozinha!</span>
              </div>
            )}

          </div>
        ) : (
          /* QUANDO NENHUM ITEM ESTIVER SELECIONADO AINDA */
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
        )}
      </div>

      {/* CORPO PRINCIPAL COM OS PRODUTOS (SELEÇÃO DIRETA) */}
      <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5">

        {/* ========================================================
            SEÇÃO 1: PIZZA (CLICOU NO SABOR -> ABRE PEDAÇO OU INTEIRO)
           ======================================================== */}
        {pizzaCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-red-500/20 text-red-400 rounded-md">
                  <Pizza className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  SEÇÃO PIZZA <span className="text-[10px] font-normal text-slate-400 normal-case">— Escolha o sabor para abrir Pedaço ou Inteira</span>
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded-full border border-amber-400/20 font-mono">
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
                    onClick={() => setSelectedPizzaFlavor(flavor)}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border ${
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

            {/* AO CLICAR NO SABOR: ABRE OS BOTÕES PEDAÇO E INTEIRA */}
            {selectedPizzaFlavor ? (
              <div className="mt-2.5 p-2 bg-gradient-to-r from-amber-950/50 via-slate-900 to-red-950/50 rounded-xl border border-amber-500/70 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                    <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                      Sabor Selecionado: <strong className="text-white text-xs underline">{selectedPizzaFlavor.name}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300">
                    Escolha <strong>PEDAÇO</strong> ou <strong>INTEIRA</strong> para abrir o nome e enviar:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pizzaCategory.variations.map((variation) => {
                    const isPedaco = variation.id === 'pedaco';
                    const isCurrentChoice = selectedProduct?.item?.id === selectedPizzaFlavor.id && selectedProduct?.variation?.id === variation.id;

                    return (
                      <button
                        key={variation.id}
                        onClick={() => handleSelectPizzaVariation(selectedPizzaFlavor, variation)}
                        className={`group p-2.5 rounded-lg font-black text-left flex items-center justify-between transition-all shadow active:scale-98 border-2 ${
                          isCurrentChoice
                            ? 'ring-2 ring-white border-white scale-[1.01]'
                            : ''
                        } ${
                          isPedaco
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border-amber-300'
                            : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-400'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-black tracking-wide flex items-center gap-1.5">
                            <span>{variation.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-current">
                              {variation.prefix}XX
                            </span>
                          </div>
                          <div className="text-[10px] opacity-90 font-medium">
                            {isPedaco ? 'Fatia servida na hora' : 'Pizza redonda inteira'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black">
                            R$ {variation.price.toFixed(2)}
                          </div>
                          <div className="text-[9px] mt-0.5 bg-black/30 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                            <span>SELECIONAR</span>
                            <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-center py-1 bg-slate-900/50 rounded-lg border border-dashed border-slate-700 text-[10px] text-slate-400">
                👆 Clique no sabor da pizza para ver as opções <strong>PEDAÇO</strong> e <strong>INTEIRA</strong>.
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ E BATATA FRITA
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          
          {/* SEÇÃO AÇAÍ */}
          {acaiCategory && (
            <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
              <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-purple-500/20 text-purple-400 rounded-md">
                    <IceCream className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-black text-white tracking-wide uppercase">
                    SEÇÃO AÇAÍ
                  </h2>
                </div>
                <span className="text-[10px] font-semibold text-purple-300 bg-purple-900/40 px-1.5 py-0.2 rounded-full border border-purple-500/30 font-mono">
                  A-XX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {acaiCategory.items.map((item) => {
                  const isCurrent = selectedProduct?.item?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectDirectItem(acaiCategory, item)}
                      className={`group p-2 rounded-lg text-left transition-all border shadow active:scale-98 flex flex-col justify-between min-h-[66px] ${
                        isCurrent 
                          ? 'bg-purple-900/90 border-purple-400 ring-2 ring-purple-400' 
                          : 'bg-slate-900/90 hover:bg-purple-950/80 border-slate-700 hover:border-purple-500'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-xs text-white group-hover:text-purple-200 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-purple-400 font-bold mt-0.5">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 group-hover:text-purple-300 flex items-center justify-between font-semibold mt-1 pt-1 border-t border-slate-800">
                        <span>{isCurrent ? '✓ Selecionado' : 'Selecionar'}</span>
                        <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO BATATA FRITA */}
          {batataCategory && (
            <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
              <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-yellow-500/20 text-yellow-400 rounded-md">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-black text-white tracking-wide uppercase">
                    SEÇÃO BATATA FRITA
                  </h2>
                </div>
                <span className="text-[10px] font-semibold text-yellow-300 bg-yellow-900/40 px-1.5 py-0.2 rounded-full border border-yellow-500/30 font-mono">
                  B-XX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {batataCategory.items.map((item) => {
                  const isCurrent = selectedProduct?.item?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectDirectItem(batataCategory, item)}
                      className={`group p-2 rounded-lg text-left transition-all border shadow active:scale-98 flex flex-col justify-between min-h-[66px] ${
                        isCurrent 
                          ? 'bg-amber-900/90 border-amber-400 ring-2 ring-amber-400' 
                          : 'bg-slate-900/90 hover:bg-amber-950/80 border-slate-700 hover:border-amber-500'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-xs text-white group-hover:text-amber-200 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 group-hover:text-amber-300 flex items-center justify-between font-semibold mt-1 pt-1 border-t border-slate-800">
                        <span>{isCurrent ? '✓ Selecionado' : 'Selecionar'}</span>
                        <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* RODAPÉ DO CAIXA: EM PREPARAÇÃO, PRONTAS, ENTREGUES */}
      <footer className="bg-slate-950 border-t border-slate-700 px-3 py-1.5 shrink-0 shadow-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px]">Em Preparação:</span>
            <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded font-mono">
              {countEmPreparo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-emerald-300 text-[10px]">Prontas:</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded font-mono">
              {countProntas}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span className="font-bold uppercase tracking-wider text-blue-300 text-[10px]">Entregues:</span>
            <span className="text-xs font-black text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded font-mono">
              {countEntregues}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400 font-semibold text-[10px]">Total Hoje:</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              R$ {totalFaturado.toFixed(2)}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
