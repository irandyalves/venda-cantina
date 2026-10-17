// Catálogo inicial com as categorias e produtos solicitados

export const DEFAULT_CATEGORIES = [
  {
    id: 'pizza',
    name: 'PIZZA',
    icon: 'Pizza',
    color: 'from-amber-500 to-red-600',
    prefix: {
      pedaco: 'P ped-',
      inteira: 'P int-'
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
      { id: 'pedaco', name: 'PEDAÇO', price: 9.00, prefix: 'P ped-' },
      { id: 'inteira', name: 'INTEIRA', price: 48.00, prefix: 'P int-' },
    ]
  },
  {
    id: 'acai',
    name: 'AÇAÍ',
    icon: 'IceCream',
    color: 'from-purple-600 to-indigo-800',
    prefixDefault: 'Açaí ',
    items: [
      { id: 'acai_300', name: 'Copo 300ml', price: 14.00, prefix: 'Açaí ' },
      { id: 'acai_500', name: 'Copo 500ml', price: 19.00, prefix: 'Açaí ' },
      { id: 'acai_700', name: 'Tigela 700ml', price: 25.00, prefix: 'Açaí ' },
      { id: 'acai_especial', name: 'Açaí c/ Nutella & Leite Ninho', price: 23.00, prefix: 'Açaí ' },
    ],
    variations: []
  },
  {
    id: 'batata',
    name: 'BATATA FRITA',
    icon: 'UtensilsCrossed',
    color: 'from-yellow-500 to-amber-600',
    prefixDefault: 'Bat ',
    items: [
      { id: 'bat_cone', name: 'Cone Individual (P)', price: 12.00, prefix: 'Bat ' },
      { id: 'bat_porcao', name: 'Porção Média (M)', price: 18.00, prefix: 'Bat ' },
      { id: 'bat_cheddar', name: 'Batata Cheddar & Bacon', price: 24.00, prefix: 'Bat ' },
      { id: 'bat_grande', name: 'Porção Especial Família (G)', price: 32.00, prefix: 'Bat ' },
    ],
    variations: []
  },
  {
    id: 'bebidas',
    name: 'BEBIDAS',
    icon: 'CupSoda',
    color: 'from-sky-500 to-blue-700',
    prefixDefault: 'Beb ',
    items: [
      { id: 'refri_lata', name: 'Refrigerante Lata 350ml', price: 6.00, prefix: 'Beb ' },
      { id: 'agua_mineral', name: 'Água Mineral 500ml', price: 4.00, prefix: 'Beb ' },
      { id: 'suco_natural', name: 'Suco Natural da Fruta 400ml', price: 8.00, prefix: 'Beb ' },
    ],
    variations: []
  }
];
