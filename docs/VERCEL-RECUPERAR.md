# Recuperar deploy na Vercel — União ERP

Use este guia quando o site abre mas o login ou o dashboard retornam erro de banco.

## Configuração que funcionou (commit `2b5a2db`)

Esta é a configuração de produção **antes** de remover variáveis ou forçar conexão direta na Vercel.

| Item | O que fazer |
|------|-------------|
| **Código** | `database-url.ts` prioriza `POSTGRES_PRISMA_URL` / URLs da **integração**; na Vercel usa **pooler**; **não** sobrescreve senha se a URL já tiver uma |
| **Integração** | Supabase ↔ Vercel conectada ao projeto `gvxtzvcxjodpyvaxiqqn` |
| **Manter na Vercel** | `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AUTH_*` |
| **Remover na Vercel** | `SUPABASE_DB_PASSWORD` (conflita com senha já na URL → *password authentication failed*) |
| **Não usar em produção** | `USE_DIRECT_DATABASE_ON_VERCEL` + `db.*:5432` sem **IPv4** (→ *Can't reach database server*) |
| **Limpeza opcional** | Só após integração ativa: `.\scripts\cleanup-vercel-env.ps1` remove duplicatas `NEXT_PUBLIC_*_POSTGRES_*` **inseguras** — o app passa a usar só `POSTGRES_PRISMA_URL` |

```powershell
# 1) Reconectar integração no painel Vercel (Integrations → Supabase)
# 2) Remover senha conflitante
npx vercel env rm SUPABASE_DB_PASSWORD production --yes
npx vercel env rm SUPABASE_DB_PASSWORD preview --yes
# 3) Deploy
npx vercel --prod
```

Teste: https://uniao-pied.vercel.app/api/health/db → `{"ok":true}`

---

## Sintoma

- `/api/health/db` retorna `503`
- Login: "E-mail ou senha incorretos" (mesmo com credenciais certas)
- Logs Vercel: `tenant/user postgres.REF not found` ou `Can't reach database server`

## Causa

- Variáveis duplicadas da integração (`NEXT_PUBLIC_SUPABASE_URL_POSTGRES_*`) ou `SUPABASE_DB_PASSWORD` sobrescrevendo a senha da URL.
- Conexão **direta** `db.*:5432` na Vercel sem **IPv4** no Supabase.

---

## Opção A — Integração Supabase (recomendado)

1. [vercel.com](https://vercel.com) → projeto **uniao** → **Integrations**
2. **Supabase** → conectar o projeto **gvxtzvcxjodpyvaxiqqn**
3. Conclua o passo no navegador se o CLI pedir "Additional setup"
4. Confirme que existem variáveis **server-side** (sem `NEXT_PUBLIC_` no nome do Postgres):
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
5. Remova variáveis antigas com prefixo errado:
   ```powershell
   .\scripts\cleanup-vercel-env.ps1
   ```
6. Redeploy:
   ```powershell
   npx vercel --prod
   ```

---

## Opção B — IPv4 + conexão direta

1. [Supabase → Database Settings](https://supabase.com/dashboard/project/gvxtzvcxjodpyvaxiqqn/settings/database)
2. Ative **IPv4** (add-on, se disponível no plano)
3. Copie a **Direct connection** (porta 5432)
4. Na Vercel, defina (Production):

| Variável | Valor |
|----------|--------|
| `POSTGRES_PRISMA_URL` | URI Direct |
| `DATABASE_URL` | mesma URI |
| `DIRECT_DATABASE_URL` | mesma URI |
| `USE_DIRECT_DATABASE_ON_VERCEL` | `true` |

5. `npx vercel --prod`

---

## Opção C — Sincronizar do `.env` local

```powershell
npm run supabase:configure -- --password=SUA_SENHA
.\scripts\sync-vercel-db-env.ps1
# Defina na Vercel: USE_DIRECT_DATABASE_ON_VERCEL=true
npx vercel --prod
```

> Só funciona na Vercel se a Opção B (IPv4) estiver ativa.

---

## Testar

- https://uniao-pied.vercel.app/api/health/db → `{"ok":true}`
- Login: `jonathadelgado@gmail.com` / `ua042728`

## Local

Se o `.env` foi trocado para `prisma+postgres://localhost`:

```powershell
npm run supabase:configure -- --password=SUA_SENHA
npm run db:check
npm run dev
```
