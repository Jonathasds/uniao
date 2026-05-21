/**
 * Inicia `next dev` sem variáveis da Vercel no shell (evita pooler/local quebrado).
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");

const env = { ...process.env };

delete env.VERCEL;
delete env.VERCEL_ENV;
delete env.VERCEL_URL;
delete env.VERCEL_TARGET_ENV;
env.NODE_ENV = "development";

if (process.env.VERCEL === "1") {
  console.warn(
    "[dev] Removido VERCEL=1 do ambiente — use conexão direta do .env (db.*:5432)."
  );
}

const child = spawn("npx", ["next", "dev", "--webpack"], {
  cwd: ROOT_DIR,
  env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
