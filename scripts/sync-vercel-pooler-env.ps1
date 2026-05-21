# Define URLs do session pooler na Vercel (producao estavel).
# Uso: npm run supabase:configure  &&  .\scripts\sync-vercel-pooler-env.ps1
# Depois: npx vercel --prod

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Error "Arquivo .env nao encontrado. Rode npm run supabase:configure primeiro."
}

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    Set-Variable -Name $name -Value $value -Scope Script
  }
}

if (-not $SUPABASE_DB_PASSWORD) {
  Write-Error "SUPABASE_DB_PASSWORD ausente no .env"
}

$ref = "gvxtzvcxjodpyvaxiqqn"
$encoded = [uri]::EscapeDataString($SUPABASE_DB_PASSWORD)
$poolerUrl = "postgresql://postgres.${ref}:${encoded}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
$directUrl = $DIRECT_DATABASE_URL
if (-not $directUrl) {
  $directUrl = "postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?sslmode=require"
}

$entries = @{
  POSTGRES_PRISMA_URL       = $poolerUrl
  DATABASE_URL              = $poolerUrl
  POSTGRES_URL_NON_POOLING  = $directUrl
  DIRECT_DATABASE_URL       = $directUrl
  NEXT_PUBLIC_SUPABASE_URL  = $NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  AUTH_SECRET               = $AUTH_SECRET
  AUTH_TRUST_HOST           = "true"
  AUTH_URL                  = "https://uniao-pied.vercel.app"
}

$remove = @(
  "USE_DIRECT_DATABASE_ON_VERCEL",
  "SUPABASE_DB_PASSWORD"
)

foreach ($key in $remove) {
  foreach ($target in @("production", "preview")) {
    Write-Host "Removendo $key ($target)..."
    npx vercel@latest env rm $key $target --yes 2>$null
  }
}

$failed = $false
foreach ($key in $entries.Keys) {
  if (-not $entries[$key]) { continue }
  Write-Host "Definindo $key (production)..."
  npx vercel@latest env rm $key production --yes 2>$null
  $entries[$key] | npx vercel@latest env add $key production --yes 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao definir $key"
    $failed = $true
  }
}
if ($failed) { exit 1 }

Write-Host ""
Write-Host "OK. Rode: npx vercel --prod"
Write-Host "Teste: https://uniao-pied.vercel.app/api/health/db"
