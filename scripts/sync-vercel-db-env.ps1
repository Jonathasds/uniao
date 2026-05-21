# Define URLs de banco server-side na Vercel a partir do .env local.
# Uso: .\scripts\sync-vercel-db-env.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
  Write-Error "Arquivo .env nao encontrado."
}

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    Set-Variable -Name $name -Value $value -Scope Script
  }
}

$entries = @{
  POSTGRES_PRISMA_URL              = $DIRECT_DATABASE_URL
  POSTGRES_URL_NON_POOLING         = $DIRECT_DATABASE_URL
  DATABASE_URL                     = $DIRECT_DATABASE_URL
  DIRECT_DATABASE_URL              = $DIRECT_DATABASE_URL
  USE_DIRECT_DATABASE_ON_VERCEL    = "true"
}

foreach ($key in $entries.Keys) {
  if (-not $entries[$key]) { continue }
  Write-Host "Definindo $key (production)..."
  npx vercel@latest env rm $key production --yes 2>&1 | Out-Null
  $entries[$key] | npx vercel@latest env add $key production --yes 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Error "Falha ao definir $key" }
}

Write-Host ""
Write-Host "OK. Rode: .\scripts\cleanup-vercel-env.ps1"
