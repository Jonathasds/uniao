# Instalação com Supabase — União ERP

Este guia configura o banco na nuvem para **desenvolvimento local**, **Vercel** e **testes com outras pessoas**.

---

## 1. Criar conta e projeto

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta (grátis).
2. Clique em **New project**.
3. Escolha:
   - **Name:** `uniao-erp` (ou outro nome)
   - **Database password:** anote em local seguro (você vai usar na connection string)
   - **Region:** South America (São Paulo), se disponível
4. Aguarde o projeto ficar **Active** (1–2 minutos).

---

## 2. Copiar as connection strings

No painel do projeto:

1. **Connect** (botão no topo) ou **Project Settings → Database**
2. Aba **ORMs** → **Prisma**

Você precisa de **duas** URLs (ou só a do pooler — o projeto deriva a direta automaticamente):

| Uso | Onde pegar | Porta | Variável |
|-----|------------|-------|----------|
| **Local** (`npm run dev`) | **Direct connection** | 5432 | `DATABASE_URL` (usuário `postgres`) |
| **Vercel** / serverless | **Transaction pooler** ou Direct + **IPv4** | 6543 / 5432 | `DATABASE_URL` |
| `db push` / migrate | **Direct connection** | 5432 | `DIRECT_DATABASE_URL` |

Substitua `[YOUR-PASSWORD]` pela senha do banco que você definiu ao criar o projeto.

Exemplo (formato típico):

**Local (este projeto):**
```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.gvxtzvcxjodpyvaxiqqn.supabase.co:5432/postgres"
```

**Vercel (pooler):**
```env
DATABASE_URL="postgresql://postgres.gvxtzvcxjodpyvaxiqqn:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

> Se a senha tiver `@`, use `%40` no lugar (ex.: `@senha` → `%40senha`).

---

## 3. Configurar o projeto local (automático)

O projeto **gvxtzvcxjodpyvaxiqqn** (São Paulo) já está no `.env`. Falta só a **senha do banco**:

**Opção A — arquivo (recomendado)**

```powershell
Copy-Item .env.supabase.example .env.supabase
notepad .env.supabase
# Coloque: SUPABASE_DB_PASSWORD=sua-senha

npm run supabase:configure
```

**Opção B — comando direto**

```powershell
npm run supabase:configure -- --password=SUA_SENHA_DO_SUPABASE
```

O script preenche `DATABASE_URL`, roda `db:setup` e `db:check`.

Senha: [Dashboard do projeto](https://supabase.com/dashboard/project/gvxtzvcxjodpyvaxiqqn/settings/database) → **Database password** (ou **Reset database password**).

---

## 4. Criar tabelas e dados de teste

```powershell
npm install
npm run db:setup
```

Isso executa `prisma db push` + `db:seed` (usuários, produtos, vendas de exemplo).

Teste a conexão:

```powershell
npm run db:check
```

Deve aparecer: `Conexão OK. Usuários no banco: ...`

---

## 5. Cliente Supabase no código

Pacotes: `@supabase/supabase-js`, `@supabase/ssr`.

| Arquivo | Uso |
|---------|-----|
| `src/utils/supabase/client.ts` | Client Components |
| `src/utils/supabase/server.ts` | Server Components / Actions |
| `src/utils/supabase/middleware.ts` | Refresh de sessão (já ligado em `src/middleware.ts`) |

Exemplo em Server Component:

```tsx
import { createServerSupabaseClient } from "@/utils/supabase/server";

const supabase = await createServerSupabaseClient();
const { data } = await supabase.from("sua_tabela").select();
```

> **Login do ERP:** continua com **NextAuth** + tabela `User` no Postgres (Prisma). O SDK Supabase serve para Auth/Storage/Realtime ou consultas via API REST; as tabelas do ERP vêm do `npm run db:setup` (Prisma), não da demo `todos` do painel.

---

## 6. Rodar o app

```powershell
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e entre com:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | jonathadelgado@gmail.com | ua042728 |
| Vendedor | vendedor@uniao.com | vendedor123 |

> Não precisa mais de `npx prisma dev` se estiver usando só Supabase.

---

## 7. Conectar à Vercel (produção)

**URL do app:** https://uniao-pied.vercel.app

1. No [painel Vercel](https://vercel.com/jonathasds-projects/uniao/settings/environment-variables), confira:
   - `DATABASE_URL` — **Session pooler** (`aws-0-sa-east-1.pooler.supabase.com:5432`) ou **Direct** com **IPv4** ativado no Supabase
   - `SUPABASE_DB_PASSWORD` (opcional) — senha em texto puro; evita erro ao colar `%40` na URL
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `AUTH_URL` = `https://uniao-pied.vercel.app`
   - `AUTH_SECRET`, `AUTH_TRUST_HOST=true`

2. No Supabase: **Project Settings → Database** → copie **Session pooler** (porta 5432) ou ative **IPv4** e use **Direct connection**.

3. **Segurança (Vercel):** não use `NEXT_PUBLIC_*` para URLs/senhas do Postgres. Use só variáveis server-side: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `DATABASE_URL`. Remova variáveis criadas pela integração com prefixo errado:
   ```powershell
   .\scripts\sync-vercel-db-env.ps1
   .\scripts\cleanup-vercel-env.ps1
   npx vercel --prod
   ```

4. Se `/api/health/db` retornar **503** na Vercel:
   - Erro `Can't reach database server at db....supabase.co` → ative **IPv4** no Supabase; depois defina `USE_DIRECT_DATABASE_ON_VERCEL=1` e `DIRECT_DATABASE_URL` (Direct).
   - Erro `tenant/user postgres.REF not found` → na Vercel, use a URL **Transaction pooler** copiada do painel Supabase (Connect → ORMs → Prisma) em `POSTGRES_PRISMA_URL` ou `DATABASE_URL`, e `SUPABASE_DB_PASSWORD` com a senha em texto puro. Evite variáveis duplicadas da integração com prefixo errado (`NEXT_PUBLIC_SUPABASE_URL_POSTGRES_*` expostas ao browser) — prefira renomear no painel Vercel para `POSTGRES_PRISMA_URL` / `DATABASE_URL`.
   - Diagnóstico temporário: `HEALTH_DB_DEBUG=1` na Vercel (mostra `error` no JSON; remova depois).

4. Redeploy:
   ```powershell
   npx vercel --prod
   ```

## 7b. (legado) Variáveis Vercel

1. [vercel.com](https://vercel.com) → projeto **uniao** → **Settings → Environment Variables**
2. Adicione (Production + Preview):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `DATABASE_URL` | Mesma string do pooler (6543) |
| `AUTH_SECRET` | Mesmo do `.env` ou outro segredo |
| `AUTH_URL` | `https://uniao-pied.vercel.app` (sua URL) |
| `SUPABASE_DB_PASSWORD` | Senha do banco (opcional, ver §7) |
| `AUTH_TRUST_HOST` | `true` |

3. Rode **uma vez** o setup apontando para o Supabase (no PC):

```powershell
# .env já com DATABASE_URL do Supabase
npm run db:setup
```

4. Redeploy:

```powershell
npx vercel --prod
```

URL atual do projeto: **https://uniao-pied.vercel.app**

---

## 8. Supabase Studio (opcional)

No painel Supabase → **Table Editor** você vê e edita dados sem Prisma Studio.

Ou localmente:

```powershell
npm run db:studio
```

---

## Problemas comuns

### `Can't reach database server`

- Senha errada na URL (caracteres especiais devem ser **URL-encoded**, ex. `@` → `%40`).
- Firewall bloqueando; teste de outra rede.

### `prepared statement already exists` (pooler)

- Use porta **6543** com `?pgbouncer=true` em `DATABASE_URL`.
- Para `db push`, use `DIRECT_DATABASE_URL` na porta **5432**.

### Login funciona local mas não na Vercel

- `AUTH_URL` deve ser **exatamente** a URL pública (com `https://`).
- `AUTH_TRUST_HOST=true`.

### Tabelas vazias na Vercel

- Rode `npm run db:setup` com `.env` apontando para o **mesmo** Supabase da Vercel.

---

## Desenvolvimento híbrido (opcional)

| Cenário | `DATABASE_URL` |
|---------|----------------|
| Só Supabase (recomendado) | Pooler Supabase |
| Só máquina local | `npx prisma dev` → URL `postgres://...` |
| Trocar entre os dois | Altere `.env` e reinicie `npm run dev` |

---

## Próximos passos

- [Deploy na Vercel](DEPLOY-VERCEL.md)
- [README principal](../README.md)
