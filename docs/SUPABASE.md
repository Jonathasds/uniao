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
DATABASE_URL="postgresql://postgres.gvxtzvcxjodpyvaxiqqn:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
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

## 6.1. Imagens (logo e avatar) — Supabase Storage

Logos da empresa e fotos de perfil são gravados no **Supabase Storage** (não em `public/uploads`).

1. No painel: **Project Settings → API** → copie a chave **`service_role`** (secret — **nunca** no front-end).
2. No `.env` (somente servidor; a publishable `NEXT_PUBLIC_*` continua só para o SDK no browser):
   ```env
   SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
   SUPABASE_STORAGE_BUCKET="uploads"
   ```
   > **Por quê?** A `service_role` ignora RLS e só roda nas Server Actions. A publishable pode vazar no HTML/JS; usá-la para upload abriria o Storage a quem tiver a chave pública.
3. Crie o bucket público (uma vez):
   ```powershell
   npm run supabase:storage:setup
   ```
   Ou manualmente: **Storage → New bucket** → nome `uploads` → marque **Public bucket**.

4. Na **Vercel**, adicione `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_STORAGE_BUCKET=uploads` (Production).

Imagens antigas salvas como `/uploads/...` no disco local precisam ser reenviadas pelo app para aparecerem na nuvem.

---

## 7. Conectar à Vercel (produção)

**URL do app:** https://uniao-pied.vercel.app

1. No [painel Vercel](https://vercel.com/jonathasds-projects/uniao/settings/environment-variables), confira:
   - `DATABASE_URL` — **Session pooler** (copie o host do painel; este projeto: `aws-1-sa-east-1.pooler.supabase.com:5432`) ou **Direct** com **IPv4** ativado no Supabase
   - `SUPABASE_DB_PASSWORD` (opcional) — senha em texto puro; evita erro ao colar `%40` na URL
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=uploads`
   - `AUTH_URL` = `https://uniao-pied.vercel.app`
   - `AUTH_SECRET`, `AUTH_TRUST_HOST=true`

2. No Supabase: **Project Settings → Database** → copie **Session pooler** (porta 5432) ou ative **IPv4** e use **Direct connection**.

3. **Segurança (Vercel):** não use `NEXT_PUBLIC_*` para URLs/senhas do Postgres (ficam visíveis no browser). Use só variáveis **server-side**:
   - `POSTGRES_PRISMA_URL` — copie em [Dashboard → Connect → ORMs → Prisma](https://supabase.com/dashboard/project/gvxtzvcxjodpyvaxiqqn/settings/database) (Transaction pooler, porta **6543**)
   - `POSTGRES_URL_NON_POOLING` — Direct connection (porta **5432**), só para `prisma db push` local
   - `DATABASE_URL` — mesma URL que `POSTGRES_PRISMA_URL`
   - Mantenha: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AUTH_*`

   Remova variáveis antigas da integração com prefixo errado:
   ```powershell
   .\scripts\cleanup-vercel-env.ps1
   npx vercel --prod
   ```

   Se o login parar após a limpeza, cole a **URI exata** do painel Supabase em `POSTGRES_PRISMA_URL` na Vercel (não invente a URL manualmente).

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

> As tabelas do ERP têm o mesmo nome dos models Prisma (`Customer`, `Product`, `CompanySettings`, `User`, …), no schema **public**. Não confunda com a tabela demo `todos` do Supabase.

Ou localmente:

```powershell
npm run db:studio
```

---

## Problemas comuns

### Local não carrega / não grava (lista vazia, toast de sucesso sem dados)

- **Causa:** `VERCEL=1` ou `NODE_ENV=production` ficaram no terminal após `vercel env run` ou `vercel env pull`.
- **Solução:** feche o terminal e rode só `npm run dev` (o script remove `VERCEL` automaticamente). Confira: `npm run db:check` deve mostrar `Ambiente: local` e host `db....supabase.co`.
- **Não use** `vercel env run -- npm run dev` para desenvolver.

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
