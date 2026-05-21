export const PIX_KEY_TYPES = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave aleatória",
} as const;

export const PAYMENT_METHODS = {
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro",
} as const;

export const SALE_STATUS = {
  PENDING: "Esperando finalizar venda",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;

export const QUOTE_STATUS = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  CANCELLED: "Cancelado",
} as const;

export const USER_ROLES = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SELLER: "Vendedor",
  EMPLOYEE: "Funcionário",
} as const;

export const STOCK_MOVEMENT_TYPES = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
} as const;

export const GLASS_COLORS = {
  INCOLOR: "Incolor",
  VERDE: "Verde",
  FUME: "Fumê",
  REFLETIVO: "Vidro refletivo",
} as const;

export const GLASS_THICKNESSES = {
  MM_6: "6 mm",
  MM_8: "8 mm",
  MM_10: "10 mm",
} as const;

export const SERVICE_ORDER_STATUS = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/produtos", label: "Produtos", icon: "Package" },
  { href: "/clientes", label: "Clientes", icon: "Users" },
  { href: "/vendas", label: "Vendas", icon: "ShoppingCart" },
  { href: "/servicos", label: "Serviços", icon: "Settings" },
  { href: "/orcamentos", label: "Orçamentos", icon: "FileText" },
  { href: "/estoque", label: "Estoque", icon: "Warehouse" },
  { href: "/relatorios", label: "Relatórios", icon: "BarChart3" },
  { href: "/configuracoes", label: "Configurações", icon: "Settings" },
] as const;

export const ITEMS_PER_PAGE = 10;
