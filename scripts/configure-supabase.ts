/**
 * Configura DATABASE_URL do Supabase no .env e opcionalmente roda db:setup.
 * Uso:
 *   npm run supabase:configure
 *   npm run supabase:configure -- --password=SUA_SENHA
 *   (ou crie .env.supabase com SUPABASE_DB_PASSWORD=...)
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";
import * as readline from "readline";

const PROJECT_REF = "gvxtzvcxjodpyvaxiqqn";
const POOLER_HOST = "aws-0-sa-east-1.pooler.supabase.com";
/** Session pooler — recomendado para Prisma (evita erro de tenant no 6543). */
const POOLER_PORT = 5432;
const DIRECT_HOST = `db.${PROJECT_REF}.supabase.co`;
const DIRECT_PORT = 5432;

/**
 * Codifica senha para uso seguro na URL.
 * @param password - Senha do banco.
 * @returns Senha com caracteres especiais escapados.
 */
function encodePassword(password: string): string {
  return encodeURIComponent(password);
}

/**
 * Monta connection string do Supabase.
 * @param password - Senha do projeto.
 * @param mode - pooler (app) ou direct (Prisma CLI).
 * @returns URI PostgreSQL.
 */
function buildDatabaseUrl(password: string, mode: "pooler" | "direct"): string {
  const encoded = encodePassword(password);
  if (mode === "pooler") {
    return `postgresql://postgres.${PROJECT_REF}:${encoded}@${POOLER_HOST}:${POOLER_PORT}/postgres?sslmode=require`;
  }
  // Conexão direta: usuário `postgres` (não postgres.PROJECT_REF)
  return `postgresql://postgres:${encoded}@${DIRECT_HOST}:${DIRECT_PORT}/postgres?sslmode=require`;
}

/**
 * Lê senha de argumento, arquivo .env.supabase ou prompt.
 * @returns Senha do banco.
 */
async function resolvePassword(): Promise<string> {
  const arg = process.argv.find((a) => a.startsWith("--password="));
  if (arg) return arg.slice("--password=".length);

  const supabaseEnvPath = resolve(process.cwd(), ".env.supabase");
  if (existsSync(supabaseEnvPath)) {
    const content = readFileSync(supabaseEnvPath, "utf-8");
    const match = content.match(/^\s*SUPABASE_DB_PASSWORD\s*=\s*(.+)\s*$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }

  if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
    return process.env.SUPABASE_DB_PASSWORD.trim();
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolvePwd) => {
    rl.question(
      "Senha do banco Supabase (Project Settings → Database): ",
      (answer) => {
        rl.close();
        resolvePwd(answer.trim());
      }
    );
  });
}

/**
 * Atualiza ou cria entradas no arquivo .env.
 * @param root - Pasta do projeto.
 * @param entries - Pares chave/valor.
 */
function updateEnvFile(root: string, entries: Record<string, string>) {
  const envPath = resolve(root, ".env");
  let content = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}="${value.replace(/"/g, '\\"')}"`;
    const regex = new RegExp(`^${key}=.*$`, "m");
    content = regex.test(content)
      ? content.replace(regex, line)
      : `${content.trimEnd()}\n${line}\n`;
  }

  writeFileSync(envPath, content.trimEnd() + "\n", "utf-8");
}

async function main() {
  const password = await resolvePassword();
  if (!password) {
    console.error("Senha vazia. Cancele ou informe --password= ou .env.supabase");
    process.exit(1);
  }

  const root = process.cwd();
  const databaseUrl = buildDatabaseUrl(password, "pooler");
  const directUrl = buildDatabaseUrl(password, "direct");

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_X8IR_u6-IWhIgbMNnidAnQ_BHCRPwKR";

  updateEnvFile(root, {
    NEXT_PUBLIC_SUPABASE_URL: `https://${PROJECT_REF}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    DATABASE_URL: databaseUrl,
    DIRECT_DATABASE_URL: directUrl,
    AUTH_URL: process.env.AUTH_URL ?? "http://localhost:3000",
    AUTH_TRUST_HOST: "true",
    AUTH_SECRET:
      process.env.AUTH_SECRET ??
      "h7e6CsoTpPv8PVVoXvg3Bdcepd/og9yUJziLnfw4kns=",
    NODE_ENV: "development",
  });

  console.log("✓ .env atualizado (Supabase sa-east-1)");
  console.log(`  Projeto: ${PROJECT_REF}`);
  console.log(`  Pooler:  ${POOLER_HOST}:${POOLER_PORT}`);

  const runSetup = !process.argv.includes("--skip-setup");
  if (runSetup) {
    console.log("\n→ npm run db:setup ...");
    const result = spawnSync("npm run db:setup", {
      stdio: "inherit",
      shell: true,
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_DATABASE_URL: directUrl },
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
    console.log("\n→ npm run db:check ...");
    spawnSync("npm run db:check", {
      stdio: "inherit",
      shell: true,
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  }

  console.log("\nPronto. Rode: npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
