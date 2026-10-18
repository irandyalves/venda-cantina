import React from 'react';

/**
 * Biblioteca de Ícones 2D / Artes Flat de Produtos de Cantina
 * Renderiza imagem personalizada do produto (se enviada pelo operador)
 * ou a arte 2D vetorial de alta definição sem fundo correspondente.
 */

export const PRODUCT_2D_PRESETS = [
  { id: 'pizza-margueritta', label: 'Pizza Margueritta', category: 'pizza' },
  { id: 'pizza-calabresa', label: 'Pizza Calabresa', category: 'pizza' },
  { id: 'pizza-4queijos', label: 'Pizza 4 Queijos', category: 'pizza' },
  { id: 'pizza-frango', label: 'Pizza Frango c/ Catupiry', category: 'pizza' },
  { id: 'pizza-gourmet', label: 'Pizza Gourmet', category: 'pizza' },
  { id: 'pizza-pedaco', label: 'Fatia de Pizza', category: 'pizza' },
  { id: 'pizza-inteira', label: 'Pizza Inteira', category: 'pizza' },
  { id: 'acai-copo', label: 'Açaí no Copo', category: 'acai' },
  { id: 'acai-tigela', label: 'Açaí na Tigela', category: 'acai' },
  { id: 'batata-cone', label: 'Batata no Cone', category: 'batata' },
  { id: 'batata-porcao', label: 'Porção de Batata', category: 'batata' },
  { id: 'batata-cheddar', label: 'Batata c/ Cheddar & Bacon', category: 'batata' },
  { id: 'suco-laranja', label: 'Suco Natural', category: 'bebidas' },
  { id: 'refrigerante-lata', label: 'Refrigerante Lata', category: 'bebidas' },
  { id: 'agua-mineral', label: 'Água Mineral', category: 'bebidas' },
  { id: 'salada-frutas', label: 'Salada de Frutas', category: 'sobremesas' },
  { id: 'pastel-frito', label: 'Pastel Frito', category: 'salgados' },
  { id: 'coxinha', label: 'Coxinha Dourada', category: 'salgados' },
  { id: 'pao-queijo', label: 'Pão de Queijo', category: 'salgados' },
  { id: 'doce-brigadeiro', label: 'Doces / Sobremesas', category: 'sobremesas' },
];

export function resolveIconKey(item, category) {
  if (item?.icon2d) return item.icon2d;

  const itemName = String(item?.name || '').toLowerCase();
  const catId = String(category?.id || category?.name || '').toLowerCase();

  // 1. Pizzas
  if (catId.includes('pizza') || itemName.includes('pizza')) {
    if (itemName.includes('marguerita') || itemName.includes('margueritta')) return 'pizza-margueritta';
    if (itemName.includes('calabresa')) return 'pizza-calabresa';
    if (itemName.includes('queijo') || itemName.includes('4')) return 'pizza-4queijos';
    if (itemName.includes('frango') || itemName.includes('catupiry')) return 'pizza-frango';
    if (itemName.includes('gourmet') || itemName.includes('gourv')) return 'pizza-gourmet';
    if (itemName.includes('inteira')) return 'pizza-inteira';
    return 'pizza-pedaco';
  }

  // 2. Açaí
  if (catId.includes('acai') || catId.includes('açaí') || itemName.includes('acai') || itemName.includes('açaí')) {
    if (itemName.includes('tigela') || itemName.includes('700') || itemName.includes('barca')) return 'acai-tigela';
    return 'acai-copo';
  }

  // 3. Batata
  if (catId.includes('batata') || itemName.includes('batata') || itemName.includes('frita')) {
    if (itemName.includes('cheddar') || itemName.includes('bacon')) return 'batata-cheddar';
    if (itemName.includes('cone')) return 'batata-cone';
    return 'batata-porcao';
  }

  // 4. Bebidas
  if (catId.includes('bebida') || catId.includes('suco') || itemName.includes('suco') || itemName.includes('refrigerante') || itemName.includes('agua') || itemName.includes('água')) {
    if (itemName.includes('suco')) return 'suco-laranja';
    if (itemName.includes('agua') || itemName.includes('água')) return 'agua-mineral';
    return 'refrigerante-lata';
  }

  // 5. Salgados
  if (itemName.includes('pastel')) return 'pastel-frito';
  if (itemName.includes('coxinha')) return 'coxinha';
  if (itemName.includes('pão') || itemName.includes('pao')) return 'pao-queijo';
  if (itemName.includes('salada') || itemName.includes('fruta')) return 'salada-frutas';
  if (itemName.includes('doce') || itemName.includes('torta') || itemName.includes('bolo') || itemName.includes('brigadeiro')) return 'doce-brigadeiro';

  return 'pizza-pedaco';
}

export default function ProductIcon2D({ item, category, className = 'w-14 h-14', iconKey: overrideKey }) {
  // Se houver imagem customizada (upload feito pelo usuário)
  if (item?.image) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={item.image}
          alt={item.name || 'Produto'}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)] select-none transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  const key = overrideKey || resolveIconKey(item, category);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className} drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] select-none`}>
      {renderSvgArtwork(key)}
    </div>
  );
}

function renderSvgArtwork(key) {
  switch (key) {
    // ==========================================
    // 1. PIZZAS
    // ==========================================
    case 'pizza-margueritta':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="crust-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="cheese-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <radialGradient id="tomato-grad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
          </defs>
          {/* Borda da massa */}
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="url(#crust-grad)" />
          {/* Queijo derretido */}
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="url(#cheese-grad)" />
          {/* Molho vermelho exposto */}
          <circle cx="50" cy="38" r="9" fill="url(#tomato-grad)" />
          <circle cx="34" cy="52" r="7.5" fill="url(#tomato-grad)" />
          <circle cx="62" cy="56" r="8" fill="url(#tomato-grad)" />
          {/* Manjericão fresco */}
          <path d="M 44 46 C 40 40 46 32 54 36 C 54 44 48 48 44 46 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          <path d="M 33 34 C 29 28 35 22 41 26 C 41 33 37 36 33 34 Z" fill="#16a34a" />
          <path d="M 58 64 C 54 58 62 52 68 56 C 68 63 62 66 58 64 Z" fill="#22c55e" />
          {/* Queijo gratinado */}
          <circle cx="48" cy="28" r="2.5" fill="#fef9c3" opacity="0.8" />
          <circle cx="68" cy="34" r="2" fill="#fef9c3" opacity="0.8" />
          <circle cx="48" cy="70" r="2" fill="#fef9c3" opacity="0.9" />
        </svg>
      );

    case 'pizza-calabresa':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="crust-c" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <radialGradient id="calabresa-g" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="60%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>
          </defs>
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="url(#crust-c)" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#facc15" />
          {/* Rodelas de Calabresa */}
          <circle cx="50" cy="36" r="9" fill="url(#calabresa-g)" stroke="#fda4af" strokeWidth="0.6" />
          <circle cx="34" cy="48" r="8" fill="url(#calabresa-g)" stroke="#fda4af" strokeWidth="0.6" />
          <circle cx="64" cy="50" r="8.5" fill="url(#calabresa-g)" stroke="#fda4af" strokeWidth="0.6" />
          <circle cx="48" cy="68" r="7.5" fill="url(#calabresa-g)" stroke="#fda4af" strokeWidth="0.6" />
          {/* Pimentinhas / especiarias da calabresa */}
          <circle cx="48" cy="35" r="1" fill="#fff" opacity="0.6" />
          <circle cx="33" cy="47" r="1" fill="#fff" opacity="0.6" />
          <circle cx="63" cy="50" r="1" fill="#fff" opacity="0.6" />
          {/* Anéis de cebola */}
          <path d="M 28 32 Q 40 28 46 38" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d="M 52 46 Q 58 58 44 60" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </svg>
      );

    case 'pizza-4queijos':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="crust-4q" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="cheese-blend" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fde047" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>
          </defs>
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="url(#crust-4q)" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="url(#cheese-blend)" />
          {/* Manchas de Gorgonzola azul/esverdeado */}
          <circle cx="42" cy="38" r="4" fill="#0d9488" opacity="0.8" />
          <circle cx="62" cy="44" r="3.5" fill="#0f766e" opacity="0.75" />
          <circle cx="48" cy="62" r="3" fill="#0d9488" opacity="0.8" />
          {/* Tiras de Catupiry cremoso */}
          <path d="M 26 30 Q 50 45 74 30" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
          <path d="M 36 50 Q 50 62 64 50" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.95" />
          {/* Parmesão ralado gratinado dourado */}
          <circle cx="50" cy="48" r="2" fill="#713f12" />
          <circle cx="38" cy="68" r="1.8" fill="#713f12" />
        </svg>
      );

    case 'pizza-frango':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="crust-f" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="url(#crust-f)" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#eab308" />
          {/* Frango desfiado temperado */}
          <ellipse cx="44" cy="34" rx="6" ry="3.5" fill="#ca8a04" transform="rotate(-15 44 34)" />
          <ellipse cx="62" cy="40" rx="5.5" ry="3" fill="#a16207" transform="rotate(25 62 40)" />
          <ellipse cx="36" cy="54" rx="6" ry="3.5" fill="#ca8a04" transform="rotate(10 36 54)" />
          <ellipse cx="56" cy="62" rx="5" ry="3" fill="#ca8a04" transform="rotate(-30 56 62)" />
          <ellipse cx="48" cy="74" rx="4" ry="2.5" fill="#a16207" />
          {/* Espirais de Catupiry branco brilhante */}
          <path d="M 24 28 C 45 40 35 55 68 45 C 50 65 55 75 48 84" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.98" />
          {/* Salpicado de orégano verde */}
          <circle cx="40" cy="40" r="1" fill="#15803d" />
          <circle cx="58" cy="50" r="1" fill="#15803d" />
          <circle cx="48" cy="66" r="1" fill="#15803d" />
        </svg>
      );

    case 'pizza-gourmet':
    case 'pizza-inteira':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="pan-crust" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="90%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <radialGradient id="pan-cheese" cx="45%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="80%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
          </defs>
          {/* Tábua redonda */}
          <circle cx="50" cy="50" r="48" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          {/* Massa da Pizza */}
          <circle cx="50" cy="50" r="44" fill="url(#pan-crust)" />
          <circle cx="50" cy="50" r="38" fill="url(#pan-cheese)" />
          {/* Cortes das 8 fatias */}
          <line x1="50" y1="12" x2="50" y2="88" stroke="#78350f" strokeWidth="1.2" opacity="0.75" />
          <line x1="12" y1="50" x2="88" y2="50" stroke="#78350f" strokeWidth="1.2" opacity="0.75" />
          <line x1="23" y1="23" x2="77" y2="77" stroke="#78350f" strokeWidth="1.2" opacity="0.75" />
          <line x1="77" y1="23" x2="23" y2="77" stroke="#78350f" strokeWidth="1.2" opacity="0.75" />
          {/* Toppings variados em cada fatia */}
          <circle cx="50" cy="28" r="5" fill="#dc2626" />
          <circle cx="68" cy="36" r="4.5" fill="#991b1b" />
          <circle cx="72" cy="54" r="5" fill="#dc2626" />
          <circle cx="60" cy="70" r="4.5" fill="#991b1b" />
          <circle cx="42" cy="72" r="5" fill="#dc2626" />
          <circle cx="28" cy="62" r="4.5" fill="#991b1b" />
          <circle cx="28" cy="40" r="5" fill="#dc2626" />
          {/* Manjericão central */}
          <circle cx="50" cy="50" r="4" fill="#15803d" />
        </svg>
      );

    case 'pizza-pedaco':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="crust-ped" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="url(#crust-ped)" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#facc15" />
          <circle cx="45" cy="38" r="8" fill="#e11d48" />
          <circle cx="60" cy="54" r="7" fill="#be123c" />
          <circle cx="44" cy="66" r="6" fill="#e11d48" />
        </svg>
      );

    // ==========================================
    // 2. AÇAÍ
    // ==========================================
    case 'acai-copo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="acai-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="50%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e0538" />
            </linearGradient>
            <linearGradient id="cup-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="banana-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Canudo colorido */}
          <line x1="58" y1="8" x2="48" y2="40" stroke="#f43f5e" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="58" y1="8" x2="48" y2="40" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
          
          {/* Corpo do copo com Açaí */}
          <path d="M 28 32 L 35 90 Q 50 94 65 90 L 72 32 Z" fill="url(#acai-grad)" stroke="#2e0854" strokeWidth="1" />
          
          {/* Camada de Leite Condensado / Leite Ninho visível no copo */}
          <path d="M 30 52 Q 50 58 70 52 L 69 57 Q 50 63 31 57 Z" fill="#fef9c3" opacity="0.85" />
          
          {/* Brilho e reflexo do copo de acrílico */}
          <path d="M 28 32 L 35 90 Q 50 94 65 90 L 72 32 Z" fill="url(#cup-grad)" />
          <path d="M 33 36 L 38 86" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          
          {/* Cúpula transparente com recheio */}
          <ellipse cx="50" cy="32" rx="23" ry="8" fill="#3b0764" />
          <path d="M 26 32 C 26 14 74 14 74 32 Z" fill="#bae6fd" opacity="0.3" stroke="#e0f2fe" strokeWidth="1" />
          
          {/* Rodelas de banana e morango no topo */}
          <ellipse cx="44" cy="24" rx="5" ry="3" fill="url(#banana-grad)" />
          <circle cx="44" cy="24" r="1.5" fill="#713f12" opacity="0.7" />
          <ellipse cx="56" cy="22" rx="4.5" ry="2.8" fill="url(#banana-grad)" />
          {/* Moranguinho */}
          <polygon points="50,22 46,29 54,29" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
          <circle cx="49" cy="26" r="0.6" fill="#fff" />
          <circle cx="51" cy="26" r="0.6" fill="#fff" />
        </svg>
      );

    case 'acai-tigela':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="bowl-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <radialGradient id="acai-bowl-fill" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#6b21a8" />
              <stop offset="80%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e0538" />
            </radialGradient>
          </defs>
          {/* Tigela de cerâmica */}
          <path d="M 16 48 C 18 84 82 84 84 48 Z" fill="url(#bowl-grad)" stroke="#0369a1" strokeWidth="1.5" />
          <ellipse cx="50" cy="48" rx="34" ry="14" fill="#0284c7" />
          
          {/* Creme de Açaí */}
          <ellipse cx="50" cy="46" rx="32" ry="12" fill="url(#acai-bowl-fill)" />
          
          {/* Frutas no topo: Fatias de Banana enfileiradas */}
          <ellipse cx="32" cy="44" rx="5.5" ry="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
          <ellipse cx="40" cy="42" rx="5.5" ry="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
          <ellipse cx="48" cy="41" rx="5.5" ry="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
          
          {/* Morango em leque */}
          <path d="M 58 38 Q 66 34 70 42 Q 62 48 58 38 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
          <circle cx="64" cy="40" r="0.8" fill="#fff" />
          <circle cx="66" cy="43" r="0.8" fill="#fff" />
          
          {/* Granola dourada crocante */}
          <circle cx="36" cy="52" r="1.5" fill="#d97706" />
          <circle cx="42" cy="53" r="1.8" fill="#b45309" />
          <circle cx="48" cy="51" r="1.5" fill="#d97706" />
          <circle cx="56" cy="50" r="1.8" fill="#b45309" />
          <circle cx="64" cy="48" r="1.5" fill="#d97706" />
        </svg>
      );

    // ==========================================
    // 3. BATATAS FRITAS
    // ==========================================
    case 'batata-cone':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="fry-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="cone-red" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          {/* Palitos de batata crocantes saindo do cone */}
          <rect x="36" y="14" width="7" height="38" rx="2" fill="url(#fry-grad)" transform="rotate(-18 39 33)" />
          <rect x="44" y="10" width="7" height="42" rx="2" fill="url(#fry-grad)" transform="rotate(-6 47 31)" />
          <rect x="52" y="12" width="7" height="40" rx="2" fill="url(#fry-grad)" transform="rotate(10 55 32)" />
          <rect x="60" y="16" width="6.5" height="36" rx="2" fill="url(#fry-grad)" transform="rotate(22 63 34)" />
          <rect x="30" y="20" width="6.5" height="32" rx="2" fill="url(#fry-grad)" transform="rotate(-30 33 36)" />
          
          {/* Cone de papel vermelho */}
          <polygon points="26,44 74,44 50,94" fill="url(#cone-red)" stroke="#991b1b" strokeWidth="1" />
          {/* Faixa branca no cone */}
          <polygon points="32,56 68,56 50,94" fill="#ffffff" opacity="0.95" />
          <polygon points="37,68 63,68 50,94" fill="url(#cone-red)" />
        </svg>
      );

    case 'batata-cheddar':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="fry-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="cheddar-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Cestinha / Prato preto */}
          <ellipse cx="50" cy="74" rx="42" ry="16" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
          
          {/* Palitos de Batata Frita Empilhados */}
          <rect x="22" y="52" width="56" height="7" rx="2" fill="url(#fry-gold)" transform="rotate(-6 50 55)" />
          <rect x="24" y="44" width="52" height="7" rx="2" fill="url(#fry-gold)" transform="rotate(8 50 47)" />
          <rect x="28" y="36" width="46" height="7" rx="2" fill="url(#fry-gold)" transform="rotate(-4 51 39)" />
          <rect x="34" y="28" width="38" height="7" rx="2" fill="url(#fry-gold)" transform="rotate(12 53 31)" />
          
          {/* Cheddar Cremoso Derretido escorrendo */}
          <path d="M 30 38 Q 40 32 50 36 Q 60 30 70 38 Q 66 58 64 64 Q 58 54 52 66 Q 46 56 40 64 Q 34 52 30 38 Z" fill="url(#cheddar-g)" stroke="#b45309" strokeWidth="0.8" />
          
          {/* Bacon Crispy Crocante em cubinhos */}
          <rect x="36" y="42" width="5" height="4" rx="1" fill="#881337" stroke="#4c0519" strokeWidth="0.5" />
          <rect x="48" y="38" width="6" height="4.5" rx="1" fill="#9f1239" stroke="#4c0519" strokeWidth="0.5" />
          <rect x="58" y="44" width="5" height="4" rx="1" fill="#881337" stroke="#4c0519" strokeWidth="0.5" />
          <rect x="42" y="52" width="6" height="4" rx="1" fill="#9f1239" stroke="#4c0519" strokeWidth="0.5" />
          <rect x="54" y="54" width="5" height="4" rx="1" fill="#881337" stroke="#4c0519" strokeWidth="0.5" />
          {/* Cebolinha verde */}
          <circle cx="45" cy="46" r="1.5" fill="#22c55e" />
          <circle cx="53" cy="42" r="1.5" fill="#22c55e" />
          <circle cx="49" cy="58" r="1.5" fill="#22c55e" />
        </svg>
      );

    case 'batata-porcao':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="fry-b" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Cestinha Vermelha de lanchonete */}
          <path d="M 15 54 L 22 84 Q 50 88 78 84 L 85 54 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <ellipse cx="50" cy="54" rx="35" ry="9" fill="#b91c1c" />
          
          {/* Papel manteiga quadriculado dentro */}
          <ellipse cx="50" cy="52" rx="33" ry="8" fill="#f8fafc" />
          
          {/* Palitos de Batata Frita crocantes */}
          <rect x="30" y="24" width="7" height="34" rx="2" fill="url(#fry-b)" transform="rotate(-20 33 41)" />
          <rect x="40" y="18" width="7" height="38" rx="2" fill="url(#fry-b)" transform="rotate(-8 43 37)" />
          <rect x="48" y="16" width="7.5" height="40" rx="2" fill="url(#fry-b)" transform="rotate(4 51 36)" />
          <rect x="58" y="20" width="7" height="38" rx="2" fill="url(#fry-b)" transform="rotate(18 61 39)" />
          <rect x="66" y="26" width="7" height="32" rx="2" fill="url(#fry-b)" transform="rotate(28 69 42)" />
        </svg>
      );

    // ==========================================
    // 4. BEBIDAS & OUTROS
    // ==========================================
    case 'refrigerante-lata':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="can-red" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="30%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="can-top" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          {/* Corpo da Lata */}
          <rect x="30" y="22" width="40" height="64" rx="6" fill="url(#can-red)" stroke="#7f1d1d" strokeWidth="1" />
          <ellipse cx="50" cy="22" rx="20" ry="6" fill="url(#can-top)" stroke="#64748b" strokeWidth="1" />
          <ellipse cx="50" cy="22" rx="14" ry="4" fill="#cbd5e1" />
          {/* Lacre da lata */}
          <ellipse cx="50" cy="22" rx="4" ry="2" fill="#475569" />
          {/* Onda branca estilizada da lata */}
          <path d="M 30 46 Q 48 38 70 56 L 70 66 Q 50 48 30 56 Z" fill="#ffffff" opacity="0.95" />
          {/* Gotículas de condensação gelada */}
          <circle cx="40" cy="68" r="1.5" fill="#bae6fd" opacity="0.8" />
          <circle cx="58" cy="74" r="1.8" fill="#bae6fd" opacity="0.8" />
          <circle cx="62" cy="40" r="1.3" fill="#bae6fd" opacity="0.8" />
        </svg>
      );

    case 'suco-laranja':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="juice-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          {/* Canudo */}
          <line x1="62" y1="10" x2="48" y2="45" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          {/* Rodela de Laranja na borda */}
          <circle cx="36" cy="26" r="14" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
          <circle cx="36" cy="26" r="11" fill="#fdba74" />
          <circle cx="36" cy="26" r="2" fill="#fff" />
          {/* Copo com Suco */}
          <path d="M 32 30 L 38 88 Q 50 92 62 88 L 68 30 Z" fill="url(#juice-g)" stroke="#c2410c" strokeWidth="1" />
          {/* Cubos de gelo boiando */}
          <rect x="42" y="38" width="9" height="9" rx="2" fill="#ffffff" opacity="0.65" transform="rotate(15 46 42)" />
          <rect x="52" y="48" width="8" height="8" rx="2" fill="#ffffff" opacity="0.65" transform="rotate(-20 56 52)" />
        </svg>
      );

    case 'agua-mineral':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="water-bottle" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Tampa Azul */}
          <rect x="44" y="12" width="12" height="8" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          {/* Gargalo */}
          <path d="M 46 20 L 46 26 L 36 38 L 36 86 Q 50 90 64 86 L 64 38 L 54 26 L 54 20 Z" fill="url(#water-bottle)" opacity="0.85" stroke="#0284c7" strokeWidth="1" />
          {/* Rótulo com gota de água */}
          <rect x="36" y="50" width="28" height="18" fill="#0284c7" />
          <path d="M 50 54 C 47 59 45 61 45 63 C 45 66 47 68 50 68 C 53 68 55 66 55 63 C 55 61 53 59 50 54 Z" fill="#ffffff" />
        </svg>
      );

    case 'pastel-frito':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="pastel-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="80%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          {/* Massa crocante estufada e dourada */}
          <path d="M 18 36 Q 50 20 82 36 L 76 74 Q 50 86 24 74 Z" fill="url(#pastel-gold)" stroke="#b45309" strokeWidth="1.5" />
          {/* Marcas de garfo nas bordas */}
          <path d="M 20 38 L 24 44 M 25 36 L 29 42 M 30 34 L 34 40 M 70 34 L 66 40 M 75 36 L 71 42 M 80 38 L 76 44" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 26 72 L 30 66 M 32 74 L 36 68 M 68 74 L 64 68 M 74 72 L 70 66" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
          {/* Bolhas crocantes de fritura */}
          <circle cx="44" cy="46" r="3" fill="#ca8a04" opacity="0.75" />
          <circle cx="58" cy="52" r="3.5" fill="#a16207" opacity="0.7" />
          <circle cx="40" cy="62" r="2.5" fill="#ca8a04" opacity="0.75" />
          <circle cx="62" cy="40" r="2.5" fill="#ca8a04" opacity="0.75" />
        </svg>
      );

    case 'salada-frutas':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Tigela de vidro */}
          <path d="M 16 50 C 18 84 82 84 84 50 Z" fill="#e0f2fe" opacity="0.7" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Frutas coloridas misturadas */}
          {/* Melancia vermelha */}
          <path d="M 26 44 Q 38 34 44 48 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
          <circle cx="34" cy="42" r="0.8" fill="#000" />
          {/* Kiwi verde com sementes */}
          <circle cx="52" cy="40" r="9" fill="#84cc16" stroke="#4d7c0f" strokeWidth="0.8" />
          <circle cx="52" cy="40" r="3.5" fill="#ecfccb" />
          <circle cx="50" cy="38" r="0.6" fill="#000" />
          <circle cx="54" cy="38" r="0.6" fill="#000" />
          <circle cx="50" cy="42" r="0.6" fill="#000" />
          <circle cx="54" cy="42" r="0.6" fill="#000" />
          {/* Uvas roxas */}
          <circle cx="68" cy="42" r="5" fill="#7e22ce" />
          <circle cx="73" cy="48" r="4.5" fill="#6b21a8" />
          <circle cx="64" cy="50" r="5" fill="#7e22ce" />
          {/* Cubos de Manga / Laranja */}
          <rect x="36" y="48" width="8" height="8" rx="2" fill="#f97316" />
          <rect x="46" y="52" width="7" height="7" rx="1.5" fill="#eab308" />
        </svg>
      );

    case 'coxinha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="coxinha-gold" cx="45%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="75%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
          </defs>
          {/* Formato de gota da coxinha */}
          <path d="M 50 16 C 54 26 76 60 72 78 C 68 92 32 92 28 78 C 24 60 46 26 50 16 Z" fill="url(#coxinha-gold)" stroke="#713f12" strokeWidth="1.2" />
          {/* Textura crocante */}
          <circle cx="46" cy="62" r="1.5" fill="#713f12" opacity="0.6" />
          <circle cx="56" cy="68" r="1.5" fill="#713f12" opacity="0.6" />
          <circle cx="38" cy="74" r="1.2" fill="#713f12" opacity="0.6" />
          <circle cx="52" cy="78" r="1.5" fill="#713f12" opacity="0.6" />
        </svg>
      );

    case 'pao-queijo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="pdq-gold" cx="40%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="80%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="52" r="34" fill="url(#pdq-gold)" stroke="#854d0e" strokeWidth="1.2" />
          {/* Rachaduras douradas de queijo assado */}
          <path d="M 38 40 Q 48 46 54 38" fill="none" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 44 58 Q 54 62 62 54" fill="none" stroke="#713f12" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="36" cy="56" r="3" fill="#a16207" opacity="0.8" />
          <circle cx="62" cy="44" r="2.8" fill="#a16207" opacity="0.8" />
        </svg>
      );

    case 'doce-brigadeiro':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="choc-g" cx="40%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="60%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>
          </defs>
          {/* Forminha de brigadeiro */}
          <polygon points="26,62 74,62 68,88 32,88" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
          {/* Trufa / Brigadeiro redondo */}
          <circle cx="50" cy="50" r="24" fill="url(#choc-g)" />
          {/* Granulados coloridos */}
          <rect x="42" y="38" width="4" height="2" rx="0.8" fill="#facc15" transform="rotate(30 44 39)" />
          <rect x="52" y="36" width="4" height="2" rx="0.8" fill="#38bdf8" transform="rotate(-20 54 37)" />
          <rect x="44" y="48" width="4" height="2" rx="0.8" fill="#ec4899" transform="rotate(15 46 49)" />
          <rect x="56" y="48" width="4" height="2" rx="0.8" fill="#22c55e" transform="rotate(-40 58 49)" />
          <rect x="50" y="58" width="4" height="2" rx="0.8" fill="#facc15" transform="rotate(25 52 59)" />
        </svg>
      );
  }
}
