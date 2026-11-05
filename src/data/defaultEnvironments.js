// Definições padrão dos Ambientes de Trabalho do Sistema (Sincronizados em tempo real na nuvem)

export const PERFIS = {
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  COZINHA_2: 'COZINHA_2',
  PUBLICO: 'PUBLICO'
};

export const DEFAULT_ENVIRONMENTS = [
  {
    id: 'ADMIN',
    name: 'Admin (Caixa & Gestão)',
    shortName: 'Admin',
    type: 'cashier',
    icon: 'ShieldCheck',
    color: 'amber',
    isSystem: true,
    description: 'Caixa PDV, Gestão & Fechamento de Turno'
  },
  {
    id: 'COZINHA',
    name: 'Cozinha Pizza',
    shortName: 'Cozinha Pizza',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'orange',
    isSystem: true,
    description: 'Cozinha 1, Fogões & Fornos'
  },
  {
    id: 'COZINHA_2',
    name: 'Cozinha 2',
    shortName: 'Cozinha 2',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'rose',
    isSystem: true,
    description: 'Segunda Cozinha / Estação 2'
  },
  {
    id: 'PUBLICO',
    name: 'Público (Painel TV)',
    shortName: 'Público',
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
  COZINHA_2: [],
  PUBLICO: []
};
