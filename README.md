# União ERP

Sistema web de gestão comercial e estoque — ERP moderno para controle de produtos, clientes, vendas, orçamentos, estoque e relatórios.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — UI clean e responsiva
- **Prisma ORM** + **PostgreSQL** (Supabase)
- **NextAuth.js v5** — autenticação
- **Zustand** — carrinho de vendas
- **React Hook Form** + **Zod** — formulários
- **Recharts** — gráficos do dashboard
- **Framer Motion** — animações
- **Lucide React** — ícones

## Funcionalidades

| Módulo | Recursos |
|--------|----------|
| Dashboard | Vendas do mês, comparativo, pedidos abertos, estoque baixo, gráfico mensal |
| Produtos | CRUD, busca, paginação, filtro por categoria, alerta de estoque |
| Clientes | CRUD, histórico de compras, página individual |
| Vendas | Nova venda, carrinho, desconto, formas de pagamento, comprovante PDF |
| Orçamentos | Criar, converter em venda, PDF, status |
| Estoque | Entrada, saída, ajuste, histórico, alertas |
| Relatórios | Top produtos/clientes, lucro mensal, export PDF/Excel |
| Configurações | Empresa, usuários, permissões |

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) (plano gratuito)

## Instalação (Supabase)

**Guia completo:** [docs/SUPABASE.md](docs/SUPABASE.md)

### Resumo rápido

```powershell
git clone <seu-repositorio>
cd uniao
npm install
Copy-Item env.example .env
# Edite .env: DATABASE_URL (Supabase pooler 6543), AUTH_SECRET, AUTH_URL
npm run db:setup
npm run db:check
npm run dev
```

1. Crie projeto em [supabase.com](https://supabase.com)
2. Copie **Transaction pooler** (Prisma) → `DATABASE_URL` no `.env`
3. `npm run db:setup` — cria tabelas + dados de teste
4. `npm run dev` → [http://localhost:3000](http://localhost:3000)

### Postgres só na máquina (opcional)

Alternativa sem Supabase: `npx prisma dev`, copie a URL para `.env`, depois `npm run db:setup`.

## Credenciais de teste (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | jonathadelgado@gmail.com | ua042728 |
| Vendedor | vendedor@uniao.com | vendedor123 |

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar build de produção |
| `npm run db:migrate` | Executar migrations |
| `npm run db:push` | Sincronizar schema (dev) |
| `npm run db:setup` | `db push` + seed (instalação Supabase) |
| `npm run db:check` | Testar conexão com o banco |
| `npm run db:seed` | Popular banco com dados mock |
| `npm run db:studio` | Abrir Prisma Studio |

## Estrutura do projeto

```
src/
├── app/
│   ├── (dashboard)/     # Páginas autenticadas
│   ├── actions/         # Server Actions
│   ├── api/auth/        # NextAuth
│   └── login/
├── components/
│   ├── ui/              # Componentes base
│   ├── layout/          # Sidebar, Topbar
│   └── [modulos]/
├── services/            # Lógica de negócio
├── lib/                 # Auth, Prisma, utils
├── store/               # Zustand
├── types/
└── utils/
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## Deploy na Vercel

Guia completo: **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**

Resumo:

1. Crie banco no **Supabase** e rode `npm run db:push` + `npm run db:seed` apontando para ele
2. Importe o repositório em [vercel.com/new](https://vercel.com/new)
3. Variáveis: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`
4. O `vercel.json` já define `prisma generate` antes do build e região **gru1** (São Paulo)

## Dark mode

O CSS já inclui variáveis preparadas para dark mode (classe `.dark`). A implementação do toggle pode ser adicionada nas configurações.

## Licença

MIT
