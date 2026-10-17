import React, { useState, useEffect, useRef } from 'react';
import { 
  Pizza, 
  IceCream, 
  UtensilsCrossed, 
  CupSoda, 
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
  WifiOff
} from 'lucide-react';
import { storageService } from '../services/storage';
import ProfileSelector from './ProfileSelector';

export default function CashierView({ onOpenConfig, onNavigate }) {
  // Estado do Caixa
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [selectedPizzaFlavor, setSelectedPizzaFlavor] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(storageService.isFirebaseReady);

  // Estados de validação visual e foco
  const [nameShake, setNameShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

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

  // Foco inicial no nome
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Regras de validação do Nome e Quantidade
  const isNameFilled = customerName.trim().length > 0;

  // Totais do rodapé
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const countEmPreparo = todayOrders.filter(o => o.status === 'em_preparo').length;
  const countProntas = todayOrders.filter(o => o.status === 'pronto').length;
  const countEntregues = todayOrders.filter(o => o.status === 'entregue').length;
  const totalFaturado = todayOrders.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);

  // Disparo direto do pedido (SEM PASSAR POR CARRINHO)
  const handleDirectOrder = async ({ category, item, variation = null }) => {
    // 1. VALIDAÇÃO OBRIGATÓRIA DO NOME
    const cleanName = customerName.trim();
    if (!cleanName) {
      // Dispara o alerta com efeito de tremor e foco no nome
      setNameShake(true);
      setShowNameError(true);
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      setTimeout(() => setNameShake(false), 500);
      return;
    }

    setShowNameError(false);
    const qty = Math.max(1, parseInt(quantity) || 1);

    // Determina o prefixo da comanda
    let prefix = 'Ped-';
    let unitPrice = item.price || 0;
    let description = item.name;

    if (category.id === 'pizza' && variation) {
      prefix = variation.prefix || (variation.id === 'inteira' ? 'P int-' : 'P ped-');
      unitPrice = variation.price;
      description = `Pizza ${variation.name}: ${item.name}`;
    } else if (category.id === 'acai') {
      prefix = item.prefix || category.prefixDefault || 'Açaí ';
      description = `Açaí ${item.name}`;
    } else if (category.id === 'batata') {
      prefix = item.prefix || category.prefixDefault || 'Bat ';
      description = `Batata ${item.name}`;
    } else if (category.prefixDefault) {
      prefix = category.prefixDefault;
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
      
      // Feedback visual na tela
      setFeedbackMessage({
        type: 'success',
        text: `Comanda ${created.orderNumber} enviada para a Cozinha! (${cleanName})`
      });

      // Limpar campos e resetar para o próximo cliente
      setCustomerName('');
      setQuantity(1);
      setSelectedPizzaFlavor(null);

      // Foco imediato no campo de nome para a próxima venda!
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }

      setTimeout(() => {
        setFeedbackMessage(null);
      }, 3500);
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: 'Erro ao enviar pedido para a cozinha.'
      });
    }
  };

  const pizzaCategory = categories.find(c => c.id === 'pizza');
  const acaiCategory = categories.find(c => c.id === 'acai');
  const batataCategory = categories.find(c => c.id === 'batata');
  const otherCategories = categories.filter(c => !['pizza', 'acai', 'batata'].includes(c.id));

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden text-xs">
      
      {/* BARRA SUPERIOR DO CAIXA (REDUZIDA EM 25%) */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-amber-500 to-red-600 p-1.5 rounded-lg shadow">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              CANTINA EXPRESS <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/30">CAIXA PDV</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">Atendimento ultra-rápido de balcão</div>
          </div>
        </div>

        {/* STATUS DA NUVEM REALTIME + NAVEGAÇÃO E CONFIGURAÇÕES */}
        <div className="flex items-center gap-1.5">
          {/* BADGE DE REALTIME CLOUD */}
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
            isFirebaseOnline 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' 
              : 'bg-amber-950/60 text-amber-300 border-amber-600/50'
          }`} title={isFirebaseOnline ? 'Sincronização em tempo real na nuvem ativa' : 'Sincronização local ativa'}>
            {isFirebaseOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span>{isFirebaseOnline ? 'Nuvem Realtime' : 'Modo Local'}</span>
          </div>

          <button 
            onClick={() => onNavigate('kitchen')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
            title="Ir para a Tela da Cozinha"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden md:inline">Cozinha KDS</span>
          </button>

          <button 
            onClick={() => onNavigate('display')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
            title="Ir para o Painel da TV"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Painel TV</span>
          </button>

          {/* BOTÃO DA ENGRENAGEM (CONFIGURAÇÕES DO CAIXA) */}
          <button 
            onClick={() => onOpenConfig()}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-sm active:scale-95 border border-amber-500"
            title="Configurações, Cadastro de Produtos e Fechamento de Caixa"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden lg:inline">CONFIGURAÇÕES ⚙️</span>
          </button>

          {/* PERFIL NO CANTO SUPERIOR DIREITO */}
          <ProfileSelector 
            onProfileChange={(profile) => {
              if (profile === 'COZINHA') onNavigate('kitchen');
              else if (profile === 'PUBLICO') onNavigate('display');
            }}
            onOpenConfig={onOpenConfig}
          />
        </div>
      </header>

      {/* FEEDBACK DE SUCESSO/AVISO NO TOPO */}
      {feedbackMessage && (
        <div className={`px-3 py-1.5 flex items-center justify-between text-xs font-bold transition-all shadow-md shrink-0 ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          <div className="flex items-center gap-1.5 mx-auto">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 animate-bounce" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* CORPO PRINCIPAL COM SCROLL SUAVE (CARD SIZES REDUZIDOS EM 25%) */}
      <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5">
        
        {/* ========================================================
            ÁREA DE COMANDO DO CLIENTE:
            1. NOME (BORDA VERMELHA PULSANTE SE VAZIO)
            2. QUANTIDADE (BORDA PULSANTE QUANDO NOME DIGITADO)
            3. FORMA DE PAGAMENTO
           ======================================================== */}
        <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700 shadow-md grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          
          {/* NOME DO CLIENTE: BORDA VERMELHA COM EFEITO PARA CHAMAR ATENÇÃO */}
          <div className="md:col-span-5 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                isNameFilled ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <User className="w-3.5 h-3.5" />
                <span>NOME DE QUEM COMPROU *</span>
              </label>

              {/* AVISO DO STATUS DO NOME */}
              {!isNameFilled ? (
                <span className="text-[10px] text-rose-300 font-extrabold bg-rose-950/70 px-2 py-0.2 rounded border border-rose-500/60 animate-pulse">
                  ⚠️ OBRIGATÓRIO DIGITAR
                </span>
              ) : (
                <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                  ✓ Nome informado
                </span>
              )}
            </div>

            <div className={`relative ${nameShake ? 'animate-shake' : ''}`}>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Digite o nome de quem está comprando..."
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (showNameError && e.target.value.trim()) {
                    setShowNameError(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customerName.trim()) {
                    if (qtyInputRef.current) qtyInputRef.current.focus();
                  } else if (e.key === 'Escape') {
                    setCustomerName('');
                  }
                }}
                className={`w-full bg-slate-900 text-white text-sm font-bold px-3 py-1.5 rounded-lg outline-none transition-all placeholder:text-slate-500 placeholder:font-normal border-2 ${
                  !isNameFilled 
                    ? 'border-rose-500 glow-required-name' 
                    : 'border-emerald-500 ring-1 ring-emerald-500/30'
                }`}
              />
              {customerName && (
                <button 
                  onClick={() => {
                    setCustomerName('');
                    if (nameInputRef.current) nameInputRef.current.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px] bg-slate-800 px-1.5 py-0.5 rounded"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* QUANTIDADE: RECEBE O EFEITO PULSANTE ASSIM QUE DIGITAR O NOME */}
          <div className="md:col-span-3 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-black uppercase tracking-wider ${
                isNameFilled ? 'text-amber-300 font-extrabold' : 'text-slate-400'
              }`}>
                QUANTIDADE
              </label>
              {isNameFilled && (
                <span className="text-[10px] text-amber-300 font-bold animate-pulse">
                  👉 Confirme a qtde
                </span>
              )}
            </div>

            <div className={`flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border-2 transition-all ${
              isNameFilled 
                ? 'border-amber-400 glow-active-qty' 
                : 'border-slate-700'
            }`}>
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded transition-colors flex items-center justify-center"
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
                className="w-full text-center bg-transparent text-base font-black text-amber-300 outline-none"
              />
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div className="md:col-span-4 flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>FORMA DE PAGAMENTO</span>
              <span className="text-emerald-400 font-mono text-[10px]">DIRETO</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'PIX', label: 'PIX', color: 'bg-emerald-600 hover:bg-emerald-500' },
                { id: 'DINHEIRO', label: 'Dinheiro', color: 'bg-teal-600 hover:bg-teal-500' },
                { id: 'DEBITO', label: 'Débito', color: 'bg-blue-600 hover:bg-blue-500' },
                { id: 'CREDITO', label: 'Crédito', color: 'bg-indigo-600 hover:bg-indigo-500' },
              ].map(pay => (
                <button
                  key={pay.id}
                  onClick={() => setPaymentMethod(pay.id)}
                  className={`py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all border ${
                    paymentMethod === pay.id 
                      ? `${pay.color} text-white ring-1 ring-white/50 border-white/60 shadow scale-[1.02]` 
                      : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ALERTA VISUAL CASO TENTE ENVIAR SEM O NOME */}
        {showNameError && (
          <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-3 py-1.5 rounded-xl font-bold flex items-center justify-between shadow-lg animate-shake">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Por favor, digite o <strong>nome do cliente</strong> antes de selecionar o produto!</span>
            </div>
            <button 
              onClick={() => {
                setShowNameError(false);
                if (nameInputRef.current) nameInputRef.current.focus();
              }}
              className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black uppercase"
            >
              Digitar Agora
            </button>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 1: PIZZA (CLICOU NO SABOR -> ABRE PEDAÇO OU INTEIRA)
            FONTES E CARDS REDUZIDOS EM 25%
           ======================================================== */}
        {pizzaCategory && (
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-red-500/20 text-red-400 rounded-md">
                  <Pizza className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xs font-black text-white tracking-wide uppercase">
                  SEÇÃO PIZZA <span className="text-[10px] font-normal text-slate-400 normal-case">— Escolha o sabor e clique em Pedaço ou Inteira</span>
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded-full border border-amber-400/20">
                P ped-XX / P int-XX
              </span>
            </div>

            {/* BOTÕES DOS SABORES DE PIZZA (REDUZIDOS EM 25%) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {pizzaCategory.items.map((flavor) => {
                const isSelected = selectedPizzaFlavor?.id === flavor.id;
                return (
                  <button
                    key={flavor.id}
                    onClick={() => {
                      setSelectedPizzaFlavor(flavor);
                      // Se não digitou nome, chama atenção para o campo do nome
                      if (!isNameFilled && nameInputRef.current) {
                        nameInputRef.current.focus();
                      }
                    }}
                    className={`p-2 rounded-lg text-left transition-all flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow ring-1 ring-amber-400 scale-[1.01]'
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
                        {isSelected ? '✓ Ativo' : 'Escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* QUANDO UM SABOR É SELECIONADO: ABRE OS BOTÕES PEDAÇO E INTEIRA */}
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
                    Clique em <strong>PEDAÇO</strong> ou <strong>INTEIRA</strong> para <strong className="text-emerald-400">enviar direto para a cozinha</strong>:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pizzaCategory.variations.map((variation) => {
                    const isPedaco = variation.id === 'pedaco';
                    return (
                      <button
                        key={variation.id}
                        onClick={() => handleDirectOrder({
                          category: pizzaCategory,
                          item: selectedPizzaFlavor,
                          variation
                        })}
                        className={`group p-2.5 rounded-lg font-black text-left flex items-center justify-between transition-all shadow active:scale-98 border ${
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
                            {isPedaco ? 'Fatia na hora' : 'Pizza redonda inteira'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black">
                            R$ {(variation.price * quantity).toFixed(2)}
                          </div>
                          <div className="text-[10px] opacity-80">
                            {quantity > 1 ? `(${quantity}x R$ ${variation.price.toFixed(2)})` : 'Valor un.'}
                          </div>
                          <div className="text-[9px] mt-0.5 bg-black/30 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                            <span>ENVIAR DIRETO</span>
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
                👆 Clique no sabor da pizza para abrir os botões <strong>PEDAÇO</strong> e <strong>INTEIRA</strong>.
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ E BATATA FRITA (CLIQUE DIRETO)
            FONTES E CARDS REDUZIDOS EM 25%
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
                <span className="text-[10px] font-semibold text-purple-300 bg-purple-900/40 px-1.5 py-0.2 rounded-full border border-purple-500/30">
                  Açaí XX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {acaiCategory.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDirectOrder({
                      category: acaiCategory,
                      item
                    })}
                    className="group p-2 rounded-lg bg-slate-900/90 hover:bg-purple-950/80 text-left transition-all border border-slate-700 hover:border-purple-500 shadow active:scale-98 flex flex-col justify-between min-h-[66px]"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-white group-hover:text-purple-200 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-purple-400 font-bold mt-0.5">
                        R$ {(item.price * quantity).toFixed(2)}
                        {quantity > 1 && <span className="text-slate-400 text-[9px] ml-1">({quantity}x)</span>}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 group-hover:text-purple-300 flex items-center justify-between font-semibold mt-1 pt-1 border-t border-slate-800">
                      <span>Lançar direto</span>
                      <Send className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
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
                <span className="text-[10px] font-semibold text-yellow-300 bg-yellow-900/40 px-1.5 py-0.2 rounded-full border border-yellow-500/30">
                  Bat XX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {batataCategory.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDirectOrder({
                      category: batataCategory,
                      item
                    })}
                    className="group p-2 rounded-lg bg-slate-900/90 hover:bg-amber-950/80 text-left transition-all border border-slate-700 hover:border-amber-500 shadow active:scale-98 flex flex-col justify-between min-h-[66px]"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-white group-hover:text-amber-200 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                        R$ {(item.price * quantity).toFixed(2)}
                        {quantity > 1 && <span className="text-slate-400 text-[9px] ml-1">({quantity}x)</span>}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 group-hover:text-amber-300 flex items-center justify-between font-semibold mt-1 pt-1 border-t border-slate-800">
                      <span>Lançar direto</span>
                      <Send className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            SEÇÃO BEBIDAS & OUTROS (REDUZIDA EM 25%)
           ======================================================== */}
        {otherCategories.map((cat) => (
          <div key={cat.id} className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700 shadow-md">
            <div className="flex items-center gap-1.5 mb-2 border-b border-slate-700/60 pb-1">
              <span className="p-1 bg-blue-500/20 text-blue-400 rounded-md">
                <CupSoda className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-xs font-black text-white tracking-wide uppercase">
                {cat.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleDirectOrder({ category: cat, item })}
                  className="group p-2 rounded-lg bg-slate-900/90 hover:bg-slate-750 text-left transition-all border border-slate-700 hover:border-blue-500 shadow active:scale-98 flex flex-col justify-between"
                >
                  <div className="font-bold text-xs text-white leading-tight">{item.name}</div>
                  <div className="text-[11px] text-blue-400 font-bold mt-1 flex items-center justify-between">
                    <span>R$ {(item.price * quantity).toFixed(2)}</span>
                    <Send className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      </main>

      {/* ========================================================
          RODAPÉ DO COMANDO DO CAIXA: EM PREPARAÇÃO, PRONTAS, ENTREGUES
          (COMPACTO E ELEGANTE)
         ======================================================== */}
      <footer className="bg-slate-950 border-t border-slate-700 px-3 py-1.5 shrink-0 shadow-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
        
        {/* CONTADORES EM TEMPO REAL */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* EM PREPARAÇÃO */}
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px]">Em Preparação:</span>
            <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded">
              {countEmPreparo}
            </span>
          </div>

          {/* PRONTAS */}
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-emerald-300 text-[10px]">Prontas:</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
              {countProntas}
            </span>
          </div>

          {/* ENTREGUES */}
          <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span className="font-bold uppercase tracking-wider text-blue-300 text-[10px]">Entregues:</span>
            <span className="text-xs font-black text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded">
              {countEntregues}
            </span>
          </div>

        </div>

        {/* TOTAL FATURADO HOJE */}
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
