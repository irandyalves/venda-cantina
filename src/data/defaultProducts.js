// Catálogo inicial com as categorias, produtos e prefixos de comanda solicitados

export const DEFAULT_CATEGORIES = [
  {
    id: 'pizza',
    name: 'PIZZA',
    icon: 'Pizza',
    color: 'from-amber-500 to-red-600',
    prefix: {
      pedaco: 'Pp-',
      inteira: 'Pi-'
    },
    items: [
      { id: 'p_margueritta', name: 'Margueritta', description: 'Molho de tomate, mussarela, tomate e manjericão fresco' },
      { id: 'p_gourmet', name: 'Gourvê / Gourmet', description: 'Queijos nobres, presunto parma ou toque do chef' },
      { id: 'p_calabresa', name: 'Calabresa Especial', description: 'Mussarela, calabresa fatiada e cebola' },
      { id: 'p_4queijos', name: '4 Queijos', description: 'Mussarela, provolone, parmesão e catupiry' },
      { id: 'p_frango', name: 'Frango c/ Catupiry', description: 'Frango desfiado temperado com legítimo Catupiry' },
    ],
    // Variações que abrem direto ao clicar no sabor da pizza
    variations: [
      { id: 'pedaco', name: 'PEDAÇO', price: 9.00, prefix: 'Pp-' },
      { id: 'inteira', name: 'INTEIRA', price: 48.00, prefix: 'Pi-' },
    ]
  },
  {
    id: 'acai',
    name: 'AÇAÍ',
    icon: 'IceCream',
    color: 'from-purple-600 to-indigo-800',
    prefixDefault: 'A-',
    items: [
      { id: 'acai_300', name: 'Copo 300ml', price: 14.00, prefix: 'A-' },
      { id: 'acai_500', name: 'Copo 500ml', price: 19.00, prefix: 'A-' },
      { id: 'acai_700', name: 'Tigela 700ml', price: 25.00, prefix: 'A-' },
      { id: 'acai_especial', name: 'Açaí c/ Nutella & Leite Ninho', price: 23.00, prefix: 'A-' },
    ],
    variations: []
  },
  {
    id: 'batata',
    name: 'BATATA FRITA',
    icon: 'UtensilsCrossed',
    color: 'from-yellow-500 to-amber-600',
    prefixDefault: 'B-',
    items: [
      { id: 'bat_cone', name: 'Cone Individual (P)', price: 12.00, prefix: 'B-' },
      { id: 'bat_porcao', name: 'Porção Média (M)', price: 18.00, prefix: 'B-' },
      { id: 'bat_cheddar', name: 'Batata Cheddar & Bacon', price: 24.00, prefix: 'B-' },
      { id: 'bat_grande', name: 'Porção Especial Família (G)', price: 32.00, prefix: 'B-' },
    ],
    variations: []
  }
];
