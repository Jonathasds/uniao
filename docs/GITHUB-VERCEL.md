# GitHub + Vercel — União ERP

## Parte 1: Subir para o GitHub

### 1. Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. **Repository name:** `uniao` (ou outro nome)
3. Deixe **Private** ou **Public** como preferir
4. **Não** marque “Add README” (o projeto já tem código)
5. Clique em **Create repository**

### 2. Enviar o código (PowerShell)

Na pasta do projeto (ajuste `SEU_USUARIO`):

```powershell
cd "c:\Users\jonat\OneDrive\Documentos\projeto-code\uniao"

git remote add origin https://github.com/SEU_USUARIO/uniao.git
git branch -M main
git push -u origin main
```

Se o remote `origin` já existir:

```powershell
git remote set-url origin https://github.com/SEU_USUARIO/uniao.git
git push -u origin main
```

> O `.env` **não** vai para o GitHub (está no `.gitignore`). Use `env.example` como modelo.

---

## Parte 2: Deploy na Vercel pelo GitHub

### Opção A — Conectar repositório (recomendado)

1. [vercel.com/dashboard](https://vercel.com/dashboard)
2. Projeto **uniao** → **Settings** → **Git**
3. **Connect Git Repository** → escolha o repositório `uniao`
4. Cada `git push` na branch `main` gera deploy automático

### Opção B — Importar projeto novo

1. [vercel.com/new](https://vercel.com/new)
2. **Import** do repositório GitHub `uniao`
3. Framework: **Next.js** (detectado)
4. **Environment Variables** (Production):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URI do Supabase (ver [SUPABASE.md](./SUPABASE.md)) |
| `DIRECT_DATABASE_URL` | Conexão direta 5432 (opcional) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gvxtzvcxjodpyvaxiqqn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sua chave |
| `AUTH_SECRET` | mesmo do `.env` local |
| `AUTH_URL` | `https://uniao-pied.vercel.app` (ou URL do projeto) |
| `AUTH_TRUST_HOST` | `true` |

5. **Deploy**

### Após o deploy

1. Confira: `https://SEU-PROJETO.vercel.app/api/health/db` → deve retornar `{"ok":true}`
2. Se der 503: no Supabase ative **IPv4** ou use **Transaction pooler** em `DATABASE_URL` ([SUPABASE.md](./SUPABASE.md) §7)
3. Atualize `AUTH_URL` na Vercel com a URL final do projeto

---

## URL atual (CLI)

Produção atual: **https://uniao-pied.vercel.app**

---

## Comandos úteis

```powershell
# Deploy manual (sem Git)
npx vercel --prod

# Ver variáveis na Vercel
npx vercel env ls

# Testar banco local
npm run db:check
```
