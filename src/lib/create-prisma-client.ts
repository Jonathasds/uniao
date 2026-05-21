import dns from "node:dns";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import {
  getPgPoolOptions,
  isSupabaseDatabaseUrl,
  isVercelDeployment,
  requireSupabaseDatasourceUrls,
} from "@/lib/database-url";

if (isVercelDeployment()) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Incremente ao alterar o schema Prisma para invalidar o client em cache no dev.
 */
const PRISMA_CLIENT_CACHE_VERSION = 24;

type PrismaCache = {
  client: PrismaClient;
  pool: Pool;
  version: number;
};

const globalForPrisma = globalThis as unknown as {
  prismaCache: PrismaCache | undefined;
};

export {
  requireSupabaseDatasourceUrls,
  resolvePostgresUrl,
} from "@/lib/database-url";

/**
 * Monta config do pool `pg` com senha decodificada (evita erro de auth no pooler).
 * @param runtimeUrl - URL de runtime.
 * @param poolOptions - max e ssl.
 * @returns Configuração do Pool.
 */
function buildPoolConfig(
  runtimeUrl: string,
  poolOptions: ReturnType<typeof getPgPoolOptions>
): PoolConfig {
  const base: PoolConfig = {
    max: poolOptions.max,
    ssl: poolOptions.ssl,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    allowExitOnIdle: false,
  };

  if (!isSupabaseDatabaseUrl(runtimeUrl)) {
    return { ...base, connectionString: runtimeUrl };
  }

  try {
    const parsed = new URL(runtimeUrl);
    parsed.searchParams.delete("sslmode");

    return {
      ...base,
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "postgres",
    };
  } catch {
    return { ...base, connectionString: runtimeUrl };
  }
}

/**
 * @param pool - Pool PostgreSQL.
 * @returns true se o pool foi encerrado.
 */
function isPoolEnded(pool: Pool): boolean {
  return Boolean((pool as Pool & { ended?: boolean }).ended);
}

/**
 * Encerra client e pool em cache.
 */
async function destroyCachedPrisma() {
  const cached = globalForPrisma.prismaCache;
  if (!cached) return;

  try {
    await cached.client.$disconnect();
  } catch {
    /* ignore */
  }

  try {
    await cached.pool.end();
  } catch {
    /* ignore */
  }

  globalForPrisma.prismaCache = undefined;
}

/**
 * Cria Prisma Client com pool PostgreSQL acoplado (evita pool morto com client vivo).
 * @returns Instância ativa do Prisma Client.
 */
export function createPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prismaCache;

  if (
    cached &&
    cached.version === PRISMA_CLIENT_CACHE_VERSION &&
    !isPoolEnded(cached.pool)
  ) {
    return cached.client;
  }

  if (cached) {
    globalForPrisma.prismaCache = undefined;
    void cached.client.$disconnect().catch(() => {});
    void cached.pool.end().catch(() => {});
  }

  const { runtimeUrl } = requireSupabaseDatasourceUrls();

  const poolOptions = getPgPoolOptions(runtimeUrl);
  const pool = new Pool(buildPoolConfig(runtimeUrl, poolOptions));

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  globalForPrisma.prismaCache = {
    client,
    pool,
    version: PRISMA_CLIENT_CACHE_VERSION,
  };

  return client;
}

/**
 * Verifica se o banco está acessível.
 * @returns true quando SELECT 1 responde.
 */
const HEALTH_CHECK_TIMEOUT_MS = 12_000;

/**
 * Executa query com limite de tempo.
 * @param client - Prisma Client.
 * @returns Promise da query.
 */
async function queryWithTimeout(client: PrismaClient): Promise<void> {
  await Promise.race([
    client.$queryRaw`SELECT 1`,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Database health check timeout")),
        HEALTH_CHECK_TIMEOUT_MS
      );
    }),
  ]);
}

export type DatabaseConnectionResult =
  | { ok: true }
  | { ok: false; error?: string };

/**
 * Verifica conexão e opcionalmente retorna mensagem de erro (debug).
 * @returns Resultado com ok e erro sanitizado.
 */
export async function checkDatabaseConnectionDetailed(): Promise<DatabaseConnectionResult> {
  await resetPrismaConnection();

  let lastError: string | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const client = createPrismaClient();
      await queryWithTimeout(client);
      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await resetPrismaConnection();
    }
  }

  return { ok: false, error: lastError };
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const result = await checkDatabaseConnectionDetailed();
  return result.ok;
}

/**
 * Reinicia Prisma Client e pool PostgreSQL.
 */
export async function resetPrismaConnection() {
  await destroyCachedPrisma();
}
