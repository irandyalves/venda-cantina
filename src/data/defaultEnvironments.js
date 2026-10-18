// Definições padrão dos Ambientes de Trabalho do Sistema (Sincronizados em tempo real na nuvem)

export const PERFIS = {
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  PUBLICO: 'PUBLICO'
};

export const DEFAULT_ENVIRONMENTS = [
  {
    id: 'ADMIN',
    name: 'ADMIN (Caixa & Gestão)',
    shortName: 'ADMIN',
    type: 'cashier',
    icon: 'ShieldCheck',
    color: 'amber',
    isSystem: true,
    description: 'Caixa PDV, Gestão & Fechamento de Turno'
  },
  {
    id: 'COZINHA',
    name: 'COZINHA PIZZA',
    shortName: 'COZINHA PIZZA',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'orange',
    isSystem: true,
    description: 'Cozinha, Fogões & Fornos'
  },
  {
    id: 'PUBLICO',
    name: 'PÚBLICO (Painel TV)',
    shortName: 'PÚBLICO',
    type: 'display',
    icon: 'Tv',
    color: 'emerald',
    isSystem: true,
    description: 'Painel TV de Chamada de Clientes'
  }
];

export const DEFAULT_EMAIL_RULES = {
  ADMIN: ['irandyalves@gmail.com'],
  COZINHA: [],
  PUBLICO: []
};
