# Sincroniza variáveis essenciais na Vercel (Production) a partir do .env local.
# Uso: .\scripts\sync-vercel-env.ps1
# AVISO: para DATABASE_URL use .\scripts\sync-vercel-pooler-env.ps1 (session pooler).
# Este script copia o .env local (direct) — na Vercel costuma falhar sem IPv4.
# Requer: npx vercel link (projeto uniao) e .env na raiz

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Error "Arquivo .env não encontrado. Rode npm run supabase:configure primeiro."
}

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    Set-Variable -Name $name -Value $value -Scope Script
  }
}

$entries = @{
  NEXT_PUBLIC_SUPABASE_URL                   = $NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY       = $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  DATABASE_URL                               = $DATABASE_URL
  DIRECT_DATABASE_URL                        = $DIRECT_DATABASE_URL
  # Nao definir SUPABASE_DB_PASSWORD na Vercel (conflita com senha na URL da integracao)
  AUTH_SECRET                                = $AUTH_SECRET
  AUTH_TRUST_HOST                            = "true"
  AUTH_URL                                   = "https://uniao-pied.vercel.app"
}

foreach ($key in $entries.Keys) {
  Write-Host "→ $key"
  npx vercel@latest env rm $key production --yes 2>$null
  $entries[$key] | npx vercel@latest env add $key production --yes
}

Write-Host ""
Write-Host "OK - Variaveis atualizadas. Rode: npx vercel --prod"
