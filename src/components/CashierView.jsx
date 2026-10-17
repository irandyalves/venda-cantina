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
  ExternalLink,
  ChevronRight,
  User,
  Sparkles
} from 'lucide-react';
import { storageService } from '../services/storage';

export default function CashierView({ onOpenConfig, onNavigate }) {
  // Estado do Caixa
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [selectedPizzaFlavor, setSelectedPizzaFlavor] = useState(null);
  const [lastOrderSent, setLastOrderSent] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  const nameInputRef = useRef(null);

  // Carregar produtos e escutar pedidos em tempo real
  useEffect(() => {
    setCategories(storageService.getProducts());
    const unsubscribe = storageService.subscribeOrders((allOrders) => {
      setOrders(allOrders);
    });
    return () => unsubscribe();
  }, []);

  // Foco no input de nome ao carregar
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

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
    const name = customerName.trim() || 'Cliente';
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
      customerName: name,
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
      setLastOrderSent(created);
      setFeedbackMessage({
        type: 'success',
        text: `Comanda ${created.orderNumber} enviada para a Cozinha! (${name})`
      });

      // Limpar campos e resetar para o próximo cliente
      setCustomerName('');
      setQuantity(1);
      setSelectedPizzaFlavor(null);

      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }

      setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
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
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* BARRA SUPERIOR DO CAIXA */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-red-600 p-2 rounded-xl shadow-lg">
            <Pizza className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CANTINA EXPRESS <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">CAIXA PDV</span>
            </h1>
            <p className="text-xs text-slate-400">Atendimento ultra-rápido de balcão</p>
          </div>
        </div>

        {/* NAVEGAÇÃO E CONFIGURAÇÕES */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate('kitchen')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
            title="Ir para a Tela da Cozinha"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-400" />
            <span>Cozinha KDS</span>
          </button>

          <button 
            onClick={() => onNavigate('display')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 shadow-sm"
            title="Ir para o Painel da TV"
          >
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>Painel TV</span>
          </button>

          {/* BOTÃO DA ENGRENAGEM (CONFIGURAÇÕES DO CAIXA) */}
          <button 
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-md hover:shadow-amber-500/20 active:scale-95 border border-amber-500"
            title="Configurações, Cadastro de Produtos e Fechamento de Caixa"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>CONFIGURAÇÕES ⚙️</span>
          </button>
        </div>
      </header>

      {/* FEEDBACK DE SUCESSO/AVISO NO TOPO */}
      {feedbackMessage && (
        <div className={`px-4 py-2 flex items-center justify-between text-sm font-semibold transition-all shadow-lg ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          <div className="flex items-center gap-2 mx-auto">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 animate-bounce" /> : <AlertCircle className="w-5 h-5" />}
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* CORPO PRINCIPAL COM SCROLL */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ÁREA DE COMANDO DO CLIENTE: NOME, QUANTIDADE E FORMA DE PAGAMENTO */}
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* NOME DO CLIENTE */}
          <div className="md:col-span-5 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Nome da Pessoa que Comprou
            </label>
            <div className="relative">
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Digite o nome do cliente..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setCustomerName('');
                }}
                className="w-full bg-slate-900 border-2 border-amber-500/60 focus:border-amber-400 text-white text-lg font-bold px-4 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-500 placeholder:font-normal focus:ring-2 focus:ring-amber-500/20"
              />
              {customerName && (
                <button 
                  onClick={() => setCustomerName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-0.5 rounded"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* QUANTIDADE */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quantidade
            </label>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input 
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center bg-transparent text-xl font-extrabold text-amber-300 outline-none"
              />
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Forma de Pagamento</span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">CONFIRMAÇÃO DIRETA</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'PIX', label: 'PIX', color: 'bg-emerald-600 hover:bg-emerald-500' },
                { id: 'DINHEIRO', label: 'Dinheiro', color: 'bg-teal-600 hover:bg-teal-500' },
                { id: 'DEBITO', label: 'Débito', color: 'bg-blue-600 hover:bg-blue-500' },
                { id: 'CREDITO', label: 'Crédito', color: 'bg-indigo-600 hover:bg-indigo-500' },
              ].map(pay => (
                <button
                  key={pay.id}
                  onClick={() => setPaymentMethod(pay.id)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all border ${
                    paymentMethod === pay.id 
                      ? `${pay.color} text-white ring-2 ring-white/50 border-white/60 shadow-md scale-102` 
                      : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ========================================================
            SEÇÃO 1: PIZZA (CLICOU NO SABOR -> ABRE PEDAÇO OU INTEIRA)
           ======================================================== */}
        {pizzaCategory && (
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
                  <Pizza className="w-5 h-5" />
                </span>
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  SEÇÃO PIZZA <span className="text-xs font-normal text-slate-400">— Escolha o sabor e clique em Pedaço ou Inteira</span>
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Gera: P ped-XX ou P int-XX
              </span>
            </div>

            {/* BOTÕES DOS SABORES DE PIZZA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {pizzaCategory.items.map((flavor) => {
                const isSelected = selectedPizzaFlavor?.id === flavor.id;
                return (
                  <button
                    key={flavor.id}
                    onClick={() => setSelectedPizzaFlavor(flavor)}
                    className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                        : 'bg-slate-900/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm leading-tight">{flavor.name}</div>
                      <div className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        {flavor.description || 'Sabor tradicional'}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        {isSelected ? '✓ Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* QUANDO UM SABOR É SELECIONADO: ABRE OS BOTÕES PEDAÇO E INTEIRA */}
            {selectedPizzaFlavor ? (
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-950/60 via-slate-900 to-red-950/60 rounded-xl border-2 border-amber-500/80 shadow-2xl animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                      Sabor Selecionado: <strong className="text-white text-sm underline">{selectedPizzaFlavor.name}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-slate-300">
                    Clique na opção para <strong>confirmar e enviar direto para a cozinha</strong>:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`group relative p-4 rounded-xl font-black text-left flex items-center justify-between transition-all shadow-xl active:scale-98 border-2 ${
                          isPedaco
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border-amber-300'
                            : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-400'
                        }`}
                      >
                        <div>
                          <div className="text-lg font-black tracking-wide flex items-center gap-2">
                            <span>{variation.name}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/20 text-current">
                              {variation.prefix}XX
                            </span>
                          </div>
                          <div className="text-xs opacity-90 mt-0.5 font-medium">
                            {isPedaco ? 'Fatia servida na hora' : 'Pizza redonda inteira'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-extrabold">
                            R$ {(variation.price * quantity).toFixed(2)}
                          </div>
                          <div className="text-[11px] opacity-80">
                            {quantity > 1 ? `(${quantity}x R$ ${variation.price.toFixed(2)})` : 'Valor un.'}
                          </div>
                          <div className="text-[10px] mt-1 bg-black/30 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                            <span>ENVIAR DIRETO</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center py-2 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-xs text-slate-400">
                👆 Clique em um dos sabores de pizza acima para ver os botões <strong>PEDAÇO</strong> e <strong>INTEIRA</strong>.
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2: AÇAÍ E BATATA FRITA (CLIQUE DIRETO)
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* SEÇÃO AÇAÍ */}
          {acaiCategory && (
            <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                      <IceCream className="w-5 h-5" />
                    </span>
                    <h2 className="text-base font-extrabold text-white tracking-wide">
                      SEÇÃO AÇAÍ
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Gera: Açaí XX
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {acaiCategory.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleDirectOrder({
                        category: acaiCategory,
                        item
                      })}
                      className="group p-3 rounded-xl bg-slate-900/90 hover:bg-purple-950/80 text-left transition-all border border-slate-700 hover:border-purple-500 shadow-md active:scale-98 flex flex-col justify-between min-h-[90px]"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-white group-hover:text-purple-200">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-purple-400 font-bold mt-1">
                          R$ {(item.price * quantity).toFixed(2)}
                          {quantity > 1 && <span className="text-slate-400 text-[10px] ml-1">({quantity}x)</span>}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-300 flex items-center justify-between font-semibold mt-2 pt-1 border-t border-slate-800">
                        <span>Lançar direto</span>
                        <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO BATATA FRITA */}
          {batataCategory && (
            <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg">
                      <UtensilsCrossed className="w-5 h-5" />
                    </span>
                    <h2 className="text-base font-extrabold text-white tracking-wide">
                      SEÇÃO BATATA FRITA
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-yellow-300 bg-yellow-900/40 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    Gera: Bat XX
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {batataCategory.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleDirectOrder({
                        category: batataCategory,
                        item
                      })}
                      className="group p-3 rounded-xl bg-slate-900/90 hover:bg-amber-950/80 text-left transition-all border border-slate-700 hover:border-amber-500 shadow-md active:scale-98 flex flex-col justify-between min-h-[90px]"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-white group-hover:text-amber-200">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-amber-400 font-bold mt-1">
                          R$ {(item.price * quantity).toFixed(2)}
                          {quantity > 1 && <span className="text-slate-400 text-[10px] ml-1">({quantity}x)</span>}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-amber-300 flex items-center justify-between font-semibold mt-2 pt-1 border-t border-slate-800">
                        <span>Lançar direto</span>
                        <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            SEÇÃO OUTROS / BEBIDAS (SE HOUVER)
           ======================================================== */}
        {otherCategories.map((cat) => (
          <div key={cat.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-700/60 pb-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <CupSoda className="w-5 h-5" />
              </span>
              <h2 className="text-base font-extrabold text-white tracking-wide">
                {cat.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleDirectOrder({ category: cat, item })}
                  className="group p-3 rounded-xl bg-slate-900/90 hover:bg-slate-750 text-left transition-all border border-slate-700 hover:border-blue-500 shadow-md active:scale-98 flex flex-col justify-between"
                >
                  <div className="font-bold text-sm text-white">{item.name}</div>
                  <div className="text-xs text-blue-400 font-bold mt-2 flex items-center justify-between">
                    <span>R$ {(item.price * quantity).toFixed(2)}</span>
                    <Send className="w-3 h-3 text-slate-400 group-hover:text-blue-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      </main>

      {/* ========================================================
          RODAPÉ DO COMANDO DO CAIXA: EM PREPARAÇÃO, PRONTAS, ENTREGUES
         ======================================================== */}
      <footer className="bg-slate-950 border-t-2 border-slate-700 px-4 py-2.5 shrink-0 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* CONTADORES EM TEMPO REAL */}
        <div className="flex items-center gap-3 sm:gap-6">
          
          {/* EM PREPARAÇÃO */}
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold uppercase tracking-wider text-amber-300">Em Preparação:</span>
            <span className="text-base font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg">
              {countEmPreparo}
            </span>
          </div>

          {/* PRONTAS */}
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-emerald-300">Prontas:</span>
            <span className="text-base font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg">
              {countProntas}
            </span>
          </div>

          {/* ENTREGUES */}
          <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span className="font-bold uppercase tracking-wider text-blue-300">Entregues:</span>
            <span className="text-base font-black text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-lg">
              {countEntregues}
            </span>
          </div>

        </div>

        {/* TOTAL FATURADO HOJE */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 font-semibold">Total Hoje:</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">
              R$ {totalFaturado.toFixed(2)}
            </span>
          </div>
        </div>

      </footer>

    </div>
  );
}
