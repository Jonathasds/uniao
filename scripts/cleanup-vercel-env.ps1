# Remove variaveis inseguras/duplicadas na Vercel (Production + Preview).
# Uso: .\scripts\cleanup-vercel-env.ps1
#
# IMPORTANTE: rode SOMENTE depois da integracao Supabase estar ativa e
# POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING existirem no painel.
# Nao remova SUPABASE_DB_PASSWORD antes — remova ela manualmente se login
# falhar com "password authentication failed" (senha duplicada na URL).

$ErrorActionPreference = "Continue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location (Split-Path -Parent $PSScriptRoot)

$toRemove = @(
  "SUPABASE_DB_PASSWORD",
  "SEED_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_HOST",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_URL",
  "NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL_SUPABASE_URL",
  "NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_USER",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_URL_NON_POOLING",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_DATABASE",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_PRISMA_URL",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL_SUPABASE_JWT_SECRET"
)

foreach ($envName in $toRemove) {
  foreach ($target in @("production", "preview")) {
    Write-Host "Removendo $envName ($target)..."
    npx vercel@latest env rm $envName $target --yes 2>$null
  }
}

Write-Host ""
Write-Host "OK. Variaveis sensiveis removidas."
Write-Host "Mantenha: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,"
Write-Host "          POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, AUTH_*, AUTH_URL"
Write-Host "Nao use: SUPABASE_DB_PASSWORD (senha ja vem na URL da integracao)"
