import React from 'react';

/**
 * Biblioteca de Ícones 2D / Artes Flat de Produtos de Cantina (50 Presets)
 * Renderiza imagem personalizada do produto (upload do usuário com recorte)
 * ou a arte vetorial 2D de alta definição sem fundo correspondente.
 */

export const PRODUCT_2D_PRESETS = [
  // 1. Pizzas
  { id: 'pizza-pedaco', label: 'Fatia de Pizza', category: 'pizza' },
  { id: 'pizza-inteira', label: 'Pizza Inteira', category: 'pizza' },
  { id: 'pizza-margueritta', label: 'Pizza Margueritta', category: 'pizza' },
  { id: 'pizza-calabresa', label: 'Pizza Calabresa', category: 'pizza' },
  { id: 'pizza-4queijos', label: 'Pizza 4 Queijos', category: 'pizza' },
  { id: 'pizza-frango', label: 'Pizza Frango c/ Catupiry', category: 'pizza' },
  { id: 'pizza-portuguesa', label: 'Pizza Portuguesa', category: 'pizza' },
  { id: 'pizza-chocolate', label: 'Pizza Chocolate c/ Morango', category: 'pizza' },

  // 2. Açaí
  { id: 'acai-copo', label: 'Açaí no Copo (300/500ml)', category: 'acai' },
  { id: 'acai-tigela', label: 'Açaí na Tigela', category: 'acai' },
  { id: 'acai-barca', label: 'Barca de Açaí', category: 'acai' },
  { id: 'acai-picole', label: 'Picolé de Açaí', category: 'acai' },

  // 3. Frutas & Saladas
  { id: 'salada-frutas', label: 'Salada de Frutas (Tigela)', category: 'frutas' },
  { id: 'salada-frutas-copo', label: 'Salada de Frutas (Copo)', category: 'frutas' },
  { id: 'fruta-melancia', label: 'Fatia de Melancia', category: 'frutas' },
  { id: 'fruta-banana', label: 'Banana Fresca', category: 'frutas' },
  { id: 'fruta-morango', label: 'Morango Fresco', category: 'frutas' },

  // 4. Batatas & Fritas
  { id: 'batata-cone', label: 'Batata no Cone', category: 'batata' },
  { id: 'batata-porcao', label: 'Porção de Batata', category: 'batata' },
  { id: 'batata-cheddar', label: 'Batata c/ Cheddar & Bacon', category: 'batata' },
  { id: 'batata-rustica', label: 'Batata Rústica', category: 'batata' },
  { id: 'batata-smiles', label: 'Batata Smiles / Carinha', category: 'batata' },
  { id: 'nuggets', label: 'Nuggets / Empanados', category: 'batata' },

  // 5. Lanches & Sanduíches
  { id: 'hamburguer', label: 'Hambúrguer Artesanal', category: 'lanches' },
  { id: 'cheeseburger', label: 'X-Burguer / Sanduíche', category: 'lanches' },
  { id: 'hot-dog', label: 'Cachorro-Quente / Hot Dog', category: 'lanches' },
  { id: 'misto-quente', label: 'Misto Quente / Tostex', category: 'lanches' },
  { id: 'crepe-suico', label: 'Crepe no Palito', category: 'lanches' },
  { id: 'tapioca', label: 'Tapioca Recheada', category: 'lanches' },

  // 6. Salgados Tradicionais
  { id: 'coxinha', label: 'Coxinha Dourada', category: 'salgados' },
  { id: 'pastel-frito', label: 'Pastel Frito', category: 'salgados' },
  { id: 'pao-queijo', label: 'Pão de Queijo', category: 'salgados' },
  { id: 'enroladinho', label: 'Enroladinho de Salsicha', category: 'salgados' },
  { id: 'kibe', label: 'Kibe Frito', category: 'salgados' },
  { id: 'esfiha-aberta', label: 'Esfiha Aberta', category: 'salgados' },
  { id: 'empada', label: 'Empada de Frango', category: 'salgados' },

  // 7. Bebidas
  { id: 'suco-copo', label: 'Suco no Copo c/ Canudo', category: 'bebidas' },
  { id: 'suco-laranja', label: 'Suco de Laranja', category: 'bebidas' },
  { id: 'refrigerante-lata', label: 'Refrigerante Lata', category: 'bebidas' },
  { id: 'refrigerante-garrafa', label: 'Refrigerante Garrafa / 2L', category: 'bebidas' },
  { id: 'agua-mineral', label: 'Água Mineral', category: 'bebidas' },
  { id: 'cafe-expresso', label: 'Café Expresso', category: 'bebidas' },
  { id: 'cappuccino', label: 'Cappuccino Cremoso', category: 'bebidas' },
  { id: 'achocolatado', label: 'Achocolatado / Toddynho', category: 'bebidas' },

  // 8. Sobremesas, Doces & Pipoca
  { id: 'sorvete-casquinha', label: 'Sorvete de Casquinha', category: 'doces' },
  { id: 'picole', label: 'Picolé de Fruta', category: 'doces' },
  { id: 'doce-brigadeiro', label: 'Brigadeiro Gourmet', category: 'doces' },
  { id: 'bolo-fatia', label: 'Fatia de Bolo', category: 'doces' },
  { id: 'donut', label: 'Donut / Rosquinha', category: 'doces' },
  { id: 'pipoca', label: 'Pipoca Quentinha', category: 'doces' },
];

export function resolveIconKey(item, category) {
  if (item?.icon2d) return item.icon2d;

  const itemName = String(item?.name || '').toLowerCase();
  const catId = String(category?.id || '').toLowerCase();
  const catName = String(category?.name || item?.categoryName || '').toLowerCase();
  const searchStr = `${itemName} ${catId} ${catName}`;

  // 1. Frutas e Salada de Frutas (Prioridade para resolver imediatamente itens de salada de fruta)
  if (searchStr.includes('salada') || searchStr.includes('fruta') || searchStr.includes('fruit')) {
    if (searchStr.includes('melancia')) return 'fruta-melancia';
    if (searchStr.includes('banana')) return 'fruta-banana';
    if (searchStr.includes('morango')) return 'fruta-morango';
    if (searchStr.includes('copo') || searchStr.includes('500') || searchStr.includes('300')) return 'salada-frutas-copo';
    return 'salada-frutas';
  }

  // 2. Pizzas
  if (catId.includes('pizza') || catName.includes('pizza') || itemName.includes('pizza')) {
    if (itemName.includes('marguerita') || itemName.includes('margueritta')) return 'pizza-margueritta';
    if (itemName.includes('calabresa')) return 'pizza-calabresa';
    if (itemName.includes('queijo') || itemName.includes('4')) return 'pizza-4queijos';
    if (itemName.includes('frango') || itemName.includes('catupiry')) return 'pizza-frango';
    if (itemName.includes('portuguesa')) return 'pizza-portuguesa';
    if (itemName.includes('chocolate') || itemName.includes('doce')) return 'pizza-chocolate';
    if (itemName.includes('inteira')) return 'pizza-inteira';
    return 'pizza-pedaco';
  }

  // 3. Açaí
  if (searchStr.includes('acai') || searchStr.includes('açaí')) {
    if (itemName.includes('barca')) return 'acai-barca';
    if (itemName.includes('picolé') || itemName.includes('picole')) return 'acai-picole';
    if (itemName.includes('tigela') || itemName.includes('700')) return 'acai-tigela';
    return 'acai-copo';
  }

  // 4. Batatas & Fritas
  if (searchStr.includes('batata') || searchStr.includes('frita')) {
    if (itemName.includes('cheddar') || itemName.includes('bacon')) return 'batata-cheddar';
    if (itemName.includes('rustica') || itemName.includes('rústica')) return 'batata-rustica';
    if (itemName.includes('smile') || itemName.includes('carinha')) return 'batata-smiles';
    if (itemName.includes('cone')) return 'batata-cone';
    return 'batata-porcao';
  }

  if (searchStr.includes('nugget') || searchStr.includes('empanado')) return 'nuggets';

  // 5. Lanches & Sanduíches
  if (searchStr.includes('burger') || searchStr.includes('hamburguer') || searchStr.includes('hambúrguer')) return 'hamburguer';
  if (searchStr.includes('x-') || searchStr.includes('cheeseburger')) return 'cheeseburger';
  if (searchStr.includes('hot dog') || searchStr.includes('hotdog') || searchStr.includes('cachorro')) return 'hot-dog';
  if (searchStr.includes('misto') || searchStr.includes('tostex')) return 'misto-quente';
  if (searchStr.includes('crepe')) return 'crepe-suico';
  if (searchStr.includes('tapioca')) return 'tapioca';

  // 6. Salgados
  if (searchStr.includes('coxinha')) return 'coxinha';
  if (searchStr.includes('pastel')) return 'pastel-frito';
  if (searchStr.includes('pão de queijo') || searchStr.includes('pao de queijo')) return 'pao-queijo';
  if (searchStr.includes('enroladinho') || searchStr.includes('salsicha')) return 'enroladinho';
  if (searchStr.includes('kibe') || searchStr.includes('quibe')) return 'kibe';
  if (searchStr.includes('esfiha') || searchStr.includes('esfirra')) return 'esfiha-aberta';
  if (searchStr.includes('empada') || searchStr.includes('empadinha')) return 'empada';

  // 7. Bebidas
  if (searchStr.includes('suco')) {
    if (itemName.includes('laranja')) return 'suco-laranja';
    return 'suco-copo';
  }
  if (searchStr.includes('água') || searchStr.includes('agua')) return 'agua-mineral';
  if (searchStr.includes('refrigerante') || searchStr.includes('refri') || searchStr.includes('coca') || searchStr.includes('guaraná') || searchStr.includes('guarana')) {
    if (itemName.includes('2l') || itemName.includes('garrafa') || itemName.includes('litro')) return 'refrigerante-garrafa';
    return 'refrigerante-lata';
  }
  if (searchStr.includes('café') || searchStr.includes('cafe')) return 'cafe-expresso';
  if (searchStr.includes('cappuccino') || searchStr.includes('capuccino')) return 'cappuccino';
  if (searchStr.includes('toddynho') || searchStr.includes('toddy') || searchStr.includes('achocolatado') || searchStr.includes('nescau')) return 'achocolatado';
  if (searchStr.includes('bebida') || searchStr.includes('copo')) return 'suco-copo';

  // 8. Doces & Sobremesas
  if (searchStr.includes('sorvete') || searchStr.includes('casquinha')) return 'sorvete-casquinha';
  if (searchStr.includes('picolé') || searchStr.includes('picole')) return 'picole';
  if (searchStr.includes('brigadeiro') || searchStr.includes('trufa') || searchStr.includes('bombom')) return 'doce-brigadeiro';
  if (searchStr.includes('bolo') || searchStr.includes('torta')) return 'bolo-fatia';
  if (searchStr.includes('donut') || searchStr.includes('rosquinha')) return 'donut';
  if (searchStr.includes('pipoca')) return 'pipoca';

  // Fallback padrão: Cloche / Prato Gourmet (Nunca Pizza para itens desconhecidos!)
  return 'comida-cloche';
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
    case 'pizza-pedaco':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#facc15" />
          <circle cx="50" cy="38" r="8" fill="#dc2626" />
          <circle cx="34" cy="52" r="7" fill="#dc2626" />
          <circle cx="62" cy="56" r="7.5" fill="#dc2626" />
        </svg>
      );

    case 'pizza-inteira':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <circle cx="50" cy="50" r="38" fill="#facc15" />
          <line x1="50" y1="12" x2="50" y2="88" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="12" y1="50" x2="88" y2="50" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="23" y1="23" x2="77" y2="77" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="23" y1="77" x2="77" y2="23" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
          <circle cx="50" cy="32" r="5.5" fill="#dc2626" />
          <circle cx="68" cy="50" r="5.5" fill="#dc2626" />
          <circle cx="50" cy="68" r="5.5" fill="#dc2626" />
          <circle cx="32" cy="50" r="5.5" fill="#dc2626" />
          <circle cx="38" cy="38" r="5" fill="#dc2626" />
          <circle cx="62" cy="38" r="5" fill="#dc2626" />
          <circle cx="62" cy="62" r="5" fill="#dc2626" />
          <circle cx="38" cy="62" r="5" fill="#dc2626" />
        </svg>
      );

    case 'pizza-margueritta':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#fef08a" />
          <circle cx="50" cy="38" r="9" fill="#dc2626" />
          <circle cx="34" cy="52" r="7.5" fill="#dc2626" />
          <circle cx="62" cy="56" r="8" fill="#dc2626" />
          <path d="M 44 46 C 40 40 46 32 54 36 C 54 44 48 48 44 46 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          <path d="M 33 34 C 29 28 35 22 41 26 C 41 33 37 36 33 34 Z" fill="#16a34a" />
          <circle cx="48" cy="28" r="2.5" fill="#fef9c3" opacity="0.8" />
        </svg>
      );

    case 'pizza-calabresa':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#facc15" />
          <circle cx="50" cy="36" r="9" fill="#9f1239" stroke="#fda4af" strokeWidth="0.8" />
          <circle cx="34" cy="48" r="8" fill="#9f1239" stroke="#fda4af" strokeWidth="0.8" />
          <circle cx="64" cy="50" r="8.5" fill="#9f1239" stroke="#fda4af" strokeWidth="0.8" />
          <circle cx="48" cy="68" r="7.5" fill="#9f1239" stroke="#fda4af" strokeWidth="0.8" />
          <path d="M 28 32 Q 40 28 46 38" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
          <path d="M 52 46 Q 58 58 44 60" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'pizza-4queijos':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#fde047" />
          <circle cx="42" cy="38" r="4.5" fill="#0d9488" opacity="0.85" />
          <circle cx="62" cy="44" r="4" fill="#0f766e" opacity="0.8" />
          <path d="M 26 30 Q 50 45 74 30" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 36 50 Q 50 62 64 50" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'pizza-frango':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#eab308" />
          <path d="M 26 28 Q 50 46 74 28" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 34 48 Q 50 62 66 48" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="40" cy="38" r="3" fill="#ca8a04" />
          <circle cx="60" cy="38" r="3" fill="#ca8a04" />
          <circle cx="50" cy="56" r="3" fill="#ca8a04" />
        </svg>
      );

    case 'pizza-portuguesa':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#d97706" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#facc15" />
          <circle cx="44" cy="40" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="3" />
          <circle cx="62" cy="52" r="6" fill="#f43f5e" />
          <circle cx="36" cy="62" r="5" fill="#15803d" />
          <circle cx="52" cy="72" r="4" fill="#0f172a" />
          <path d="M 30 32 Q 50 24 70 34" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'pizza-chocolate':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12 18 Q 50 8 88 18 L 50 92 Z" fill="#78350f" />
          <path d="M 17 24 Q 50 16 83 24 L 50 86 Z" fill="#451a03" />
          <path d="M 40 40 L 46 32 L 52 40 L 46 48 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
          <path d="M 58 52 L 64 44 L 70 52 L 64 60 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
          <path d="M 34 56 L 40 48 L 46 56 L 40 64 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
          <circle cx="50" cy="70" r="2.5" fill="#fef08a" />
          <circle cx="62" cy="34" r="2.5" fill="#fef08a" />
        </svg>
      );

    // ==========================================
    // 2. AÇAÍ
    // ==========================================
    case 'acai-copo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="32,32 68,32 62,88 38,88" fill="#3b0764" stroke="#581c87" strokeWidth="1.5" />
          <ellipse cx="50" cy="32" rx="18" ry="6" fill="#581c87" />
          <ellipse cx="50" cy="24" rx="15" ry="8" fill="#a855f7" />
          <rect x="54" y="8" width="5" height="32" rx="2.5" fill="#facc15" transform="rotate(12 56 24)" />
          <circle cx="44" cy="22" r="3" fill="#facc15" />
          <circle cx="50" cy="18" r="2.5" fill="#ef4444" />
          <circle cx="40" cy="26" r="2" fill="#ef4444" />
        </svg>
      );

    case 'acai-tigela':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 48 Q 50 92 80 48 Z" fill="#1e1b4b" stroke="#312e81" strokeWidth="2" />
          <ellipse cx="50" cy="48" rx="30" ry="10" fill="#3b0764" />
          <circle cx="36" cy="46" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="46" cy="45" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="56" cy="46" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          <circle cx="66" cy="48" r="4" fill="#ef4444" />
          <circle cx="48" cy="52" r="3.5" fill="#ef4444" />
          <circle cx="38" cy="51" r="2" fill="#facc15" />
          <circle cx="58" cy="51" r="2" fill="#facc15" />
        </svg>
      );

    case 'acai-barca':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 10 50 Q 50 82 90 50 Q 82 66 50 72 Q 18 66 10 50 Z" fill="#451a03" stroke="#292524" strokeWidth="2" />
          <ellipse cx="50" cy="52" rx="36" ry="12" fill="#3b0764" />
          <circle cx="32" cy="50" r="4" fill="#ef4444" />
          <circle cx="42" cy="50" r="4" fill="#fef08a" />
          <circle cx="50" cy="50" r="4" fill="#a855f7" />
          <circle cx="58" cy="50" r="4" fill="#fef08a" />
          <circle cx="68" cy="50" r="4" fill="#ef4444" />
        </svg>
      );

    case 'acai-picole':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="46" y="66" width="8" height="24" rx="4" fill="#d97706" />
          <path d="M 32 30 C 32 18 68 18 68 30 L 68 66 L 32 66 Z" fill="#3b0764" stroke="#581c87" strokeWidth="2" />
          <circle cx="42" cy="34" r="3" fill="#facc15" opacity="0.8" />
          <circle cx="56" cy="46" r="3.5" fill="#facc15" opacity="0.8" />
        </svg>
      );

    // ==========================================
    // 3. FRUTAS & SALADAS
    // ==========================================
    case 'salada-frutas':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 18 50 Q 50 92 82 50 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <ellipse cx="50" cy="50" rx="32" ry="11" fill="#bae6fd" />
          <circle cx="36" cy="46" r="7" fill="#ef4444" />
          <circle cx="50" cy="42" r="7.5" fill="#facc15" />
          <circle cx="64" cy="46" r="7" fill="#22c55e" />
          <circle cx="44" cy="50" r="5" fill="#a855f7" />
          <circle cx="58" cy="50" r="5" fill="#fb923c" />
          <circle cx="36" cy="44" r="1" fill="#fff" />
          <circle cx="50" cy="40" r="1" fill="#fff" />
        </svg>
      );

    case 'salada-frutas-copo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Copo transparente */}
          <polygon points="30,34 70,34 64,88 36,88" fill="#e0f2fe" opacity="0.8" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Camadas de frutas coloridas dentro do copo */}
          <rect x="37" y="72" width="26" height="14" fill="#a855f7" rx="3" />
          <rect x="35" y="56" width="30" height="15" fill="#fb923c" rx="3" />
          <rect x="33" y="40" width="34" height="15" fill="#22c55e" rx="3" />
          {/* Frutas no topo saindo do copo */}
          <circle cx="42" cy="32" r="6" fill="#ef4444" />
          <circle cx="54" cy="30" r="6.5" fill="#facc15" />
          <circle cx="62" cy="34" r="5.5" fill="#ef4444" />
          {/* Colher ou canudinho */}
          <rect x="48" y="10" width="5" height="30" rx="2.5" fill="#f43f5e" transform="rotate(-15 50 25)" />
        </svg>
      );

    case 'fruta-melancia':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 14 74 Q 50 96 86 74 L 50 20 Z" fill="#15803d" />
          <path d="M 18 70 Q 50 90 82 70 L 50 26 Z" fill="#bbf7d0" />
          <path d="M 22 66 Q 50 84 78 66 L 50 32 Z" fill="#ef4444" />
          <ellipse cx="44" cy="54" rx="1.8" ry="3.2" fill="#0f172a" transform="rotate(-15 44 54)" />
          <ellipse cx="56" cy="54" rx="1.8" ry="3.2" fill="#0f172a" transform="rotate(15 56 54)" />
          <ellipse cx="50" cy="64" rx="1.8" ry="3.2" fill="#0f172a" />
          <ellipse cx="36" cy="62" rx="1.8" ry="3.2" fill="#0f172a" transform="rotate(-25 36 62)" />
          <ellipse cx="64" cy="62" rx="1.8" ry="3.2" fill="#0f172a" transform="rotate(25 64 62)" />
        </svg>
      );

    case 'fruta-banana':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 24 28 C 38 60 72 74 84 66 C 70 76 34 68 20 32 Z" fill="#facc15" stroke="#eab308" strokeWidth="2" />
          <path d="M 24 28 C 22 25 18 24 16 26 C 18 30 20 32 20 32 Z" fill="#713f12" />
          <circle cx="84" cy="66" r="2" fill="#713f12" />
        </svg>
      );

    case 'fruta-morango':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 50 84 C 26 62 26 36 44 32 C 48 31 52 31 56 32 C 74 36 74 62 50 84 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
          {/* Folhinhas verdes */}
          <path d="M 50 32 C 44 24 38 26 34 30 C 42 34 46 34 50 32 Z" fill="#15803d" />
          <path d="M 50 32 C 56 24 62 26 66 30 C 58 34 54 34 50 32 Z" fill="#15803d" />
          <path d="M 50 32 L 50 22" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
          {/* Pontinhos amarelos */}
          <circle cx="44" cy="44" r="1.5" fill="#fef08a" />
          <circle cx="56" cy="44" r="1.5" fill="#fef08a" />
          <circle cx="50" cy="54" r="1.5" fill="#fef08a" />
          <circle cx="42" cy="62" r="1.5" fill="#fef08a" />
          <circle cx="54" cy="64" r="1.5" fill="#fef08a" />
        </svg>
      );

    // ==========================================
    // 4. BATATAS & FRITAS
    // ==========================================
    case 'batata-cone':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="32,44 68,44 50,94" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <rect x="42" y="16" width="6" height="36" rx="2" fill="#facc15" transform="rotate(-12 45 34)" />
          <rect x="48" y="12" width="6" height="38" rx="2" fill="#fef08a" transform="rotate(3 51 31)" />
          <rect x="55" y="15" width="6" height="36" rx="2" fill="#facc15" transform="rotate(18 58 33)" />
          <rect x="36" y="22" width="6" height="32" rx="2" fill="#eab308" transform="rotate(-24 39 38)" />
          <rect x="62" y="24" width="6" height="30" rx="2" fill="#eab308" transform="rotate(28 65 39)" />
        </svg>
      );

    case 'batata-porcao':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="72" rx="36" ry="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
          <rect x="30" y="44" width="34" height="7" rx="3" fill="#facc15" transform="rotate(-20 47 47)" />
          <rect x="40" y="46" width="32" height="7" rx="3" fill="#fde047" transform="rotate(15 56 49)" />
          <rect x="28" y="55" width="38" height="7" rx="3" fill="#eab308" transform="rotate(5 47 58)" />
          <rect x="36" y="58" width="36" height="7" rx="3" fill="#facc15" transform="rotate(-10 54 61)" />
        </svg>
      );

    case 'batata-cheddar':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="72" rx="36" ry="14" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="30" y="48" width="34" height="7" rx="3" fill="#facc15" transform="rotate(-15 47 51)" />
          <rect x="40" y="48" width="34" height="7" rx="3" fill="#eab308" transform="rotate(18 57 51)" />
          {/* Cheddar derretido */}
          <path d="M 28 54 Q 50 42 72 54 Q 68 68 50 64 Q 32 68 28 54 Z" fill="#ea580c" />
          {/* Bacon picadinho */}
          <rect x="40" y="52" width="5" height="3" fill="#881337" rx="1" />
          <rect x="52" y="50" width="6" height="3.5" fill="#881337" rx="1" />
          <rect x="46" y="58" width="5" height="3" fill="#881337" rx="1" />
        </svg>
      );

    case 'batata-rustica':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="72" rx="36" ry="14" fill="#475569" />
          <path d="M 24 50 Q 50 36 68 58 Q 50 58 24 50 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <path d="M 36 62 Q 62 44 78 68 Q 60 70 36 62 Z" fill="#d97706" stroke="#92400e" strokeWidth="1" />
          <circle cx="48" cy="52" r="1.5" fill="#15803d" />
          <circle cx="58" cy="58" r="1.5" fill="#15803d" />
        </svg>
      );

    case 'batata-smiles':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="34" fill="#facc15" stroke="#ca8a04" strokeWidth="3" />
          <circle cx="40" cy="42" r="4.5" fill="#713f12" />
          <circle cx="60" cy="42" r="4.5" fill="#713f12" />
          <path d="M 38 56 Q 50 72 62 56" fill="none" stroke="#713f12" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'nuggets':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="40" cy="46" rx="18" ry="14" fill="#d97706" stroke="#b45309" strokeWidth="2" transform="rotate(-15 40 46)" />
          <ellipse cx="62" cy="54" rx="18" ry="13" fill="#f59e0b" stroke="#d97706" strokeWidth="2" transform="rotate(20 62 54)" />
          <circle cx="36" cy="44" r="2" fill="#fef3c7" opacity="0.6" />
          <circle cx="64" cy="52" r="2" fill="#fef3c7" opacity="0.6" />
        </svg>
      );

    // ==========================================
    // 5. LANCHES & SANDUÍCHES
    // ==========================================
    case 'hamburguer':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Pão superior */}
          <path d="M 22 42 C 22 22 78 22 78 42 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="36" cy="30" r="1.2" fill="#fef08a" />
          <circle cx="50" cy="26" r="1.2" fill="#fef08a" />
          <circle cx="64" cy="32" r="1.2" fill="#fef08a" />
          {/* Alface */}
          <path d="M 20 44 Q 30 48 40 44 Q 50 48 60 44 Q 70 48 80 44 L 78 48 Q 50 52 22 48 Z" fill="#22c55e" />
          {/* Tomate */}
          <rect x="24" y="49" width="52" height="6" rx="2" fill="#ef4444" />
          {/* Queijo cheddar */}
          <polygon points="22,55 78,55 68,64 54,58 38,65" fill="#facc15" />
          {/* Carne artesanal */}
          <rect x="20" y="58" width="60" height="12" rx="4" fill="#451a03" stroke="#292524" strokeWidth="1" />
          {/* Pão base */}
          <path d="M 22 71 C 22 71 22 82 50 82 C 78 82 78 71 78 71 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
        </svg>
      );

    case 'cheeseburger':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 24 42 C 24 24 76 24 76 42 Z" fill="#eab308" />
          <polygon points="22,46 78,46 66,56 50,50 34,57" fill="#facc15" />
          <rect x="22" y="50" width="56" height="12" rx="4" fill="#581c87" />
          <path d="M 24 64 C 24 64 24 76 50 76 C 76 76 76 64 76 64 Z" fill="#eab308" />
        </svg>
      );

    case 'hot-dog':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="54" rx="38" ry="16" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
          {/* Salsicha */}
          <rect x="18" y="46" width="64" height="12" rx="6" fill="#be123c" stroke="#9f1239" strokeWidth="1" />
          {/* Mostarda em zigue-zague */}
          <path d="M 22 52 Q 32 44 42 52 Q 52 60 62 52 Q 72 44 78 52" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
          {/* Batata palha */}
          <circle cx="48" cy="47" r="1.5" fill="#fef08a" />
          <circle cx="58" cy="46" r="1.5" fill="#fef08a" />
        </svg>
      );

    case 'misto-quente':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="18,72 82,72 50,22" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          {/* Recheio queijo e presunto derretendo */}
          <line x1="28" y1="62" x2="72" y2="62" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
          <line x1="34" y1="58" x2="66" y2="58" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
          {/* Marcas de grelha tostada */}
          <line x1="36" y1="46" x2="64" y2="46" stroke="#78350f" strokeWidth="2.5" />
          <line x1="42" y1="36" x2="58" y2="36" stroke="#78350f" strokeWidth="2" />
        </svg>
      );

    case 'crepe-suico':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="47" y="60" width="6" height="32" rx="2" fill="#d97706" />
          <rect x="36" y="16" width="28" height="52" rx="10" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <line x1="42" y1="28" x2="58" y2="28" stroke="#b45309" strokeWidth="2.5" />
          <line x1="42" y1="40" x2="58" y2="40" stroke="#b45309" strokeWidth="2.5" />
          <line x1="42" y1="52" x2="58" y2="52" stroke="#b45309" strokeWidth="2.5" />
        </svg>
      );

    case 'tapioca':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 62 C 20 34 80 34 80 62 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="22" y1="60" x2="78" y2="60" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
          <circle cx="44" cy="48" r="1.5" fill="#cbd5e1" />
          <circle cx="56" cy="46" r="1.5" fill="#cbd5e1" />
        </svg>
      );

    // ==========================================
    // 6. SALGADOS TRADICIONAIS
    // ==========================================
    case 'coxinha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 50 14 C 50 14 30 38 24 58 C 16 80 40 88 50 88 C 60 88 84 80 76 58 C 70 38 50 14 50 14 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="44" cy="58" r="12" fill="#f59e0b" opacity="0.6" />
        </svg>
      );

    case 'pastel-frito':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="22" y="32" width="56" height="42" rx="4" fill="#fbbf24" stroke="#d97706" strokeWidth="2" transform="rotate(-6 50 53)" />
          {/* Borda marcada por garfo */}
          <line x1="23" y1="36" x2="23" y2="70" stroke="#b45309" strokeWidth="2.5" strokeDasharray="3,3" />
          {/* Bolhas crocantes de fritura */}
          <circle cx="42" cy="44" r="3" fill="#fef08a" />
          <circle cx="58" cy="48" r="4" fill="#fef08a" />
          <circle cx="46" cy="60" r="3.5" fill="#fef08a" />
        </svg>
      );

    case 'pao-queijo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="52" r="32" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          <path d="M 38 42 Q 48 48 54 40" fill="none" stroke="#854d0e" strokeWidth="3" strokeLinecap="round" />
          <path d="M 44 60 Q 54 64 62 56" fill="none" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'enroladinho':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="18" y="44" width="64" height="16" rx="8" fill="#be123c" />
          <rect x="26" y="38" width="48" height="28" rx="6" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          <line x1="36" y1="38" x2="36" y2="66" stroke="#b45309" strokeWidth="2" />
          <line x1="48" y1="38" x2="48" y2="66" stroke="#b45309" strokeWidth="2" />
          <line x1="60" y1="38" x2="60" y2="66" stroke="#b45309" strokeWidth="2" />
        </svg>
      );

    case 'kibe':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 14 50 C 32 30 68 30 86 50 C 68 70 32 70 14 50 Z" fill="#451a03" stroke="#292524" strokeWidth="2" />
          <circle cx="44" cy="48" r="1.5" fill="#78350f" />
          <circle cx="56" cy="52" r="1.5" fill="#78350f" />
        </svg>
      );

    case 'esfiha-aberta':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,18 86,76 14,76" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <polygon points="50,28 76,70 24,70" fill="#451a03" />
          <circle cx="50" cy="50" r="4" fill="#ef4444" />
        </svg>
      );

    case 'empada':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="26,44 74,44 66,78 34,78" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
          <ellipse cx="50" cy="44" rx="24" ry="10" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="50" cy="40" r="4" fill="#b45309" />
        </svg>
      );

    // ==========================================
    // 7. BEBIDAS
    // ==========================================
    case 'suco-copo':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="32,32 68,32 62,88 38,88" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
          <ellipse cx="50" cy="32" rx="18" ry="6" fill="#ea580c" />
          {/* Canudo verde */}
          <rect x="54" y="8" width="5" height="34" rx="2" fill="#22c55e" transform="rotate(15 56 25)" />
          {/* Rodela de limão na borda */}
          <circle cx="34" cy="30" r="10" fill="#84cc16" stroke="#65a30d" strokeWidth="1" />
          <circle cx="34" cy="30" r="7" fill="#bef264" />
        </svg>
      );

    case 'suco-laranja':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="32,32 68,32 62,88 38,88" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />
          <ellipse cx="50" cy="32" rx="18" ry="6" fill="#f97316" />
          {/* Metade da laranja ao lado */}
          <circle cx="68" cy="74" r="14" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
          <circle cx="68" cy="74" r="11" fill="#fed7aa" />
          <circle cx="68" cy="74" r="9" fill="#f97316" />
          <line x1="59" y1="74" x2="77" y2="74" stroke="#fed7aa" strokeWidth="1.5" />
          <line x1="68" y1="65" x2="68" y2="83" stroke="#fed7aa" strokeWidth="1.5" />
        </svg>
      );

    case 'refrigerante-lata':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="34" y="24" width="32" height="58" rx="6" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <ellipse cx="50" cy="24" rx="16" ry="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          {/* Onda clássica de refrigerante */}
          <path d="M 34 50 Q 50 36 66 50 L 66 62 Q 50 48 34 62 Z" fill="#ffffff" />
        </svg>
      );

    case 'refrigerante-garrafa':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="44" y="12" width="12" height="8" rx="2" fill="#ef4444" />
          <path d="M 44 20 L 44 32 L 34 46 L 34 84 Q 50 90 66 84 L 66 46 L 56 32 L 56 20 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
          {/* Rótulo da garrafa */}
          <rect x="34" y="52" width="32" height="18" fill="#ef4444" />
          <line x1="38" y1="61" x2="62" y2="61" stroke="#ffffff" strokeWidth="2.5" />
        </svg>
      );

    case 'agua-mineral':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="45" y="14" width="10" height="7" rx="2" fill="#0284c7" />
          <path d="M 45 21 L 45 32 L 36 44 L 36 84 Q 50 88 64 84 L 64 44 L 55 32 L 55 21 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="36" y="52" width="28" height="16" fill="#38bdf8" opacity="0.9" />
          {/* Gotinha d'água */}
          <path d="M 50 56 C 46 62 54 62 50 56 Z" fill="#ffffff" />
        </svg>
      );

    case 'cafe-expresso':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="78" rx="28" ry="8" fill="#94a3b8" />
          <path d="M 28 42 L 32 74 Q 50 80 68 74 L 72 42 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="50" cy="42" rx="22" ry="7" fill="#451a03" />
          <ellipse cx="50" cy="42" rx="16" ry="4" fill="#78350f" opacity="0.8" />
          {/* Asa da xícara */}
          <path d="M 70 48 Q 84 56 70 66" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          {/* Vapor quentinho */}
          <path d="M 44 32 Q 40 22 46 16" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 54 30 Q 58 20 52 14" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'cappuccino':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="78" rx="28" ry="8" fill="#cbd5e1" />
          <path d="M 28 44 L 32 74 Q 50 80 68 74 L 72 44 Z" fill="#7c2d12" stroke="#431407" strokeWidth="1.5" />
          {/* Espuma cremosa alta */}
          <ellipse cx="50" cy="42" rx="22" ry="9" fill="#fef08a" />
          <path d="M 38 40 Q 50 32 62 40" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          {/* Canela em pó polvilhada */}
          <circle cx="48" cy="40" r="1" fill="#451a03" />
          <circle cx="54" cy="42" r="1" fill="#451a03" />
        </svg>
      );

    case 'achocolatado':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="34" y="28" width="32" height="54" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          <rect x="34" y="44" width="32" height="22" fill="#facc15" />
          <text x="50" y="58" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#78350f">CHOC</text>
          {/* Canudinho dobrável */}
          <path d="M 54 14 L 54 28" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 54 14 L 62 10" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    // ==========================================
    // 8. SOBREMESAS, DOCES & PIPOCA
    // ==========================================
    case 'sorvete-casquinha':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Casquinha crocante */}
          <polygon points="34,48 66,48 50,94" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
          <line x1="40" y1="58" x2="60" y2="74" stroke="#b45309" strokeWidth="1" />
          <line x1="60" y1="58" x2="40" y2="74" stroke="#b45309" strokeWidth="1" />
          {/* Bolas de sorvete */}
          <circle cx="50" cy="44" r="16" fill="#f43f5e" />
          <circle cx="50" cy="28" r="14" fill="#38bdf8" />
          <circle cx="50" cy="14" r="4" fill="#dc2626" />
        </svg>
      );

    case 'picole':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="46" y="66" width="8" height="24" rx="4" fill="#d97706" />
          <path d="M 32 30 C 32 18 68 18 68 30 L 68 66 L 32 66 Z" fill="#f43f5e" stroke="#e11d48" strokeWidth="2" />
          {/* Mordida no picolé */}
          <path d="M 56 19 C 62 24 66 18 68 24 Z" fill="#0f172a" opacity="0.3" />
        </svg>
      );

    case 'doce-brigadeiro':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="26,62 74,62 68,88 32,88" fill="#f43f5e" stroke="#be123c" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="24" fill="#3b0764" />
          <rect x="42" y="38" width="4" height="2" rx="0.8" fill="#facc15" transform="rotate(30 44 39)" />
          <rect x="52" y="36" width="4" height="2" rx="0.8" fill="#38bdf8" transform="rotate(-20 54 37)" />
          <rect x="44" y="48" width="4" height="2" rx="0.8" fill="#ec4899" transform="rotate(15 46 49)" />
          <rect x="56" y="48" width="4" height="2" rx="0.8" fill="#22c55e" transform="rotate(-40 58 49)" />
        </svg>
      );

    case 'bolo-fatia':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="18,72 82,72 64,28 36,28" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
          <line x1="24" y1="54" x2="76" y2="54" stroke="#451a03" strokeWidth="5" />
          {/* Cobertura de chocolate caindo */}
          <path d="M 34 28 Q 50 34 66 28 L 68 36 Q 50 44 32 36 Z" fill="#78350f" />
          <circle cx="50" cy="22" r="5" fill="#ef4444" />
        </svg>
      );

    case 'donut':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="34" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          {/* Glacê rosa */}
          <circle cx="50" cy="50" r="28" fill="#f43f5e" />
          {/* Furo central do donut */}
          <circle cx="50" cy="50" r="12" fill="#0f172a" />
          {/* Confeitos coloridos */}
          <rect x="36" y="32" width="5" height="2" rx="1" fill="#facc15" transform="rotate(20 38 33)" />
          <rect x="58" y="32" width="5" height="2" rx="1" fill="#38bdf8" transform="rotate(-30 60 33)" />
          <rect x="62" y="56" width="5" height="2" rx="1" fill="#22c55e" transform="rotate(45 64 57)" />
          <rect x="34" y="58" width="5" height="2" rx="1" fill="#ffffff" transform="rotate(-15 36 59)" />
        </svg>
      );

    case 'pipoca':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Balde listrado */}
          <polygon points="28,46 72,46 64,90 36,90" fill="#f8fafc" stroke="#dc2626" strokeWidth="2" />
          <line x1="39" y1="46" x2="43" y2="90" stroke="#dc2626" strokeWidth="4" />
          <line x1="50" y1="46" x2="50" y2="90" stroke="#dc2626" strokeWidth="4" />
          <line x1="61" y1="46" x2="57" y2="90" stroke="#dc2626" strokeWidth="4" />
          {/* Pipocas transbordando */}
          <circle cx="38" cy="40" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="50" cy="34" r="9" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="62" cy="38" r="8.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="44" cy="24" r="7.5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="56" cy="24" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );

    // ==========================================
    // FALLBACK: CLOCHE / PRATO GOURMET EXECUTIVO
    // ==========================================
    case 'comida-cloche':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Prato base */}
          <ellipse cx="50" cy="74" rx="38" ry="10" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
          {/* Cúpula / Tampa Cloche Gourmet */}
          <path d="M 20 68 C 20 38 80 38 80 68 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
          {/* Puxador da tampa */}
          <circle cx="50" cy="34" r="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          {/* Linha de reflexo de brilho */}
          <path d="M 32 60 C 32 46 44 44 48 44" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
  }
}
