import {
  createPrismaClient,
  resetPrismaConnection,
} from "@/lib/create-prisma-client";

const MAX_ATTEMPTS = 5;

let resetInFlight: Promise<void> | null = null;

/**
 * Extrai texto de erro incluindo cause do driver adapter.
 * @param error - Erro capturado.
 * @returns Mensagem concatenada em minúsculas.
 */
function extractErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";

  const err = error as {
    message?: string;
    code?: string;
    meta?: { driverAdapterError?: { cause?: { message?: string } } };
  };

  const parts = [err.message, err.code];

  const causeMsg = err.meta?.driverAdapterError?.cause?.message;
  if (causeMsg) parts.push(causeMsg);

  if (error instanceof Error && error.cause instanceof Error) {
    parts.push(error.cause.message);
  }

  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Verifica se o erro é de conexão com o banco (pool/conexão encerrada).
 * @param error - Erro capturado.
 * @returns true quando deve tentar reconectar.
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  const text = extractErrorText(error);

  return (
    text.includes("p1017") ||
    text.includes("p1001") ||
    text.includes("p1008") ||
    text.includes("connection terminated") ||
    text.includes("connectionclosed") ||
    text.includes("connection closed") ||
    text.includes("server has closed the connection") ||
    text.includes("cannot use a pool after calling end") ||
    text.includes("after calling end on the pool") ||
    text.includes("econnreset") ||
    text.includes("econnrefused") ||
    text.includes("etimedout") ||
    text.includes("timeout expired") ||
    text.includes("too many connections") ||
    text.includes("database unavailable")
  );
}

/**
 * Reinicia Prisma/pool uma vez por vez e valida com SELECT 1.
 */
async function ensurePrismaReset(): Promise<void> {
  if (!resetInFlight) {
    resetInFlight = (async () => {
      await resetPrismaConnection();
      await new Promise((resolve) => setTimeout(resolve, 400));
      try {
        const client = createPrismaClient();
        await client.$queryRaw`SELECT 1`;
      } catch {
        /* warmup opcional; a operação principal tentará de novo */
      }
    })().finally(() => {
      resetInFlight = null;
    });
  }

  await resetInFlight;
}

/**
 * Executa uma operação no banco com novas tentativas após reset de conexão.
 * @param operation - Função assíncrona que acessa o Prisma.
 * @returns Resultado da operação.
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isDatabaseConnectionError(error) || attempt === MAX_ATTEMPTS - 1) {
        throw error;
      }

      await ensurePrismaReset();
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  throw lastError;
}
