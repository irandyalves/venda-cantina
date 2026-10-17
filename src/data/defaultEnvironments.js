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
    name: 'COZINHA 1 (Principal)',
    shortName: 'COZINHA',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'orange',
    isSystem: true,
    description: 'Painel KDS Cozinha 1, Fogões & Fornos'
  },
  {
    id: 'COZINHA_2',
    name: 'COZINHA 2',
    shortName: 'COZINHA-2',
    type: 'kitchen',
    icon: 'ChefHat',
    color: 'indigo',
    isSystem: false,
    description: 'Equipe de apoio, fogões adicionais e massas'
  },
  {
    id: 'TENDA',
    name: 'TENDA',
    shortName: 'TENDA',
    type: 'kitchen',
    icon: 'Store',
    color: 'emerald',
    isSystem: false,
    description: 'Tenda externa de lanches rápidos e açaí'
  },
  {
    id: 'QUADRA',
    name: 'QUADRA',
    shortName: 'QUADRA',
    type: 'kitchen',
    icon: 'UtensilsCrossed',
    color: 'amber',
    isSystem: false,
    description: 'Área da quadra, fogões e churrasqueiras'
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
