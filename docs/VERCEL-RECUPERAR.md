# Recuperar deploy na Vercel — União ERP

Use este guia quando o site abre mas o login ou o dashboard retornam erro de banco.

## Sintoma

- `/api/health/db` retorna `503`
- Login: "E-mail ou senha incorretos" (mesmo com credenciais certas)
- Logs Vercel: `tenant/user postgres.REF not found` ou `Can't reach database server`

## Causa

O projeto **gvxtzvcxjodpyvaxiqqn** só responde bem pela **conexão direta** (`db.*.supabase.co:5432`). O pooler regional (`aws-0-sa-east-1.pooler`) retorna *tenant not found*.

Na Vercel, a conexão direta exige **IPv4** no Supabase **ou** a **integração Supabase** (que injeta a URL correta).

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
