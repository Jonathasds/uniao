const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const NEXT_DEV_DIR = path.join(ROOT_DIR, ".next", "dev");
const PORTS = [3000, 3001];

/**
 * Executa um comando e retorna a saida como texto.
 * @param {string} command - Comando que sera executado.
 * @returns {string} Saida padrao do comando, ou string vazia se falhar.
 */
function run(command) {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

/**
 * Aguarda por um pequeno intervalo.
 * @param {number} ms - Tempo em milissegundos.
 * @returns {Promise<void>} Promessa resolvida após o intervalo.
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca processos que estao usando uma porta local.
 * @param {number} port - Porta TCP local.
 * @returns {string[]} Lista de PIDs encontrados.
 */
function findPidsByPort(port) {
  if (process.platform === "win32") {
    const output = run(`netstat -ano -p tcp | findstr ":${port}"`);

    return [
      ...new Set(
        output
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).at(-1))
          .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0")
      ),
    ];
  }

  return [
    ...new Set(
      run(`lsof -ti tcp:${port}`)
        .split(/\r?\n/)
        .map((pid) => pid.trim())
        .filter(Boolean)
    ),
  ];
}

/**
 * Encerra processos presos nas portas usadas pelo Next.js.
 * @param {number} port - Porta TCP local.
 * @returns {void}
 */
function killPort(port) {
  for (const pid of findPidsByPort(port)) {
    if (process.platform === "win32") {
      run(`taskkill /PID ${pid} /F /T`);
    } else {
      run(`kill -9 ${pid}`);
    }

    console.log(`[ok] Porta ${port}: processo ${pid} encerrado`);
  }
}

/**
 * Remove artefatos de desenvolvimento do Next.js que costumam travar no Windows/OneDrive.
 * @returns {Promise<void>}
 */
async function removeNextDevCache() {
  if (!fs.existsSync(NEXT_DEV_DIR)) {
    return;
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      fs.rmSync(NEXT_DEV_DIR, { recursive: true, force: true });
      console.log("[ok] Cache .next/dev removido");
      return;
    } catch (error) {
      if (attempt === 3) {
        console.warn(
          `[warn] Nao foi possivel remover .next/dev automaticamente: ${error.message}`
        );
        return;
      }

      await wait(500);
    }
  }
}

/**
 * Regenera o Prisma Client para refletir o schema atual.
 * @returns {void}
 */
function generatePrismaClient() {
  try {
    execSync("npx prisma generate", {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: "inherit",
    });
    console.log("[ok] Prisma Client regenerado");
  } catch (error) {
    console.warn(
      `[warn] prisma generate falhou: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Prepara o ambiente local antes de iniciar o servidor Next.js.
 * @returns {Promise<void>}
 */
async function main() {
  for (const port of PORTS) {
    killPort(port);
  }

  await removeNextDevCache();
  generatePrismaClient();
}

main().catch((error) => {
  console.warn(`[warn] Limpeza do dev server falhou: ${error.message}`);
});
