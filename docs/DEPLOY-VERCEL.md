# Deploy na Vercel — União ERP

## Pré-requisitos

1. Conta em [vercel.com](https://vercel.com)
2. Banco PostgreSQL na nuvem ([Supabase](https://supabase.com) gratuito)
3. Repositório no GitHub (recomendado) ou deploy via CLI

## 1. Banco (Supabase)

Siga o guia **[SUPABASE.md](./SUPABASE.md)** (criar projeto, `.env`, `npm run db:setup`).

## 2. Variáveis na Vercel

No painel do projeto → **Settings → Environment Variables**:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string do Supabase (com `pgbouncer=true`) |
| `AUTH_SECRET` | String aleatória (32+ bytes em base64) |
| `AUTH_URL` | URL do deploy, ex. `https://uniao-xxx.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |

Gere `AUTH_SECRET` (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Marque as variáveis para **Production**, **Preview** e **Development**.

## 3. Deploy pelo GitHub (recomendado)

1. Crie um repositório no GitHub e envie o código:

```bash
git add .
git commit -m "Preparar deploy Vercel"
git remote add origin https://github.com/SEU_USUARIO/uniao.git
git push -u origin master
```

2. Em [vercel.com/new](https://vercel.com/new) → **Import** do repositório.
3. Framework: **Next.js** (detectado automaticamente).
4. Adicione as variáveis de ambiente (passo 2).
5. **Deploy**.

Após o primeiro deploy, atualize `AUTH_URL` para a URL final se ainda estiver com placeholder.

## 4. Deploy pela CLI (alternativa)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add AUTH_URL
vercel env add AUTH_TRUST_HOST
vercel --prod
```

## 5. Credenciais de teste

Após `db:seed` no Supabase:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | jonathadelgado@gmail.com | ua042728 |
| Vendedor | vendedor@uniao.com | vendedor123 |

## Problemas comuns

- **Build falha no TypeScript:** rode `npm run build` localmente antes de enviar.
- **Login não funciona:** confira `AUTH_URL` igual à URL do navegador e `AUTH_TRUST_HOST=true`.
- **Erro de banco:** use pooler Supabase; não use `prisma dev` (localhost) na Vercel.
- **Tabelas vazias:** execute `npm run db:push` e `npm run db:seed` com `DATABASE_URL` do Supabase.
