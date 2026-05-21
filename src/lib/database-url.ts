/**
 * Utilitários para connection strings PostgreSQL (Supabase, Prisma Dev, local).
 */

export type PrismaDatasourceUrls = {
  /** URL usada pelo Prisma CLI (`db push`, migrations). Preferir conexão direta no Supabase. */
  url: string;
  /** URL direta (porta 5432) quando `DATABASE_URL` usa pooler (6543). */
  directUrl?: string;
  /** URL otimizada para o pool `pg` em runtime (app / Vercel). */
  runtimeUrl: string;
};

/**
 * Indica se a URL aponta para um projeto Supabase.
 * @param url - Connection string PostgreSQL.
 * @returns true quando o host é Supabase.
 */
export function isSupabaseDatabaseUrl(url: string): boolean {
  return /supabase\.(co|com)/i.test(url);
}

/**
 * Extrai URL PostgreSQL direta quando DATABASE_URL usa prisma+postgres (Prisma Dev).
 * @param databaseUrl - URL do ambiente.
 * @returns URL postgres:// ou undefined.
 */
export function resolvePostgresUrl(databaseUrl: string): string | undefined {
  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://")
  ) {
    return databaseUrl;
  }

  if (
    databaseUrl.startsWith("prisma+postgres://") ||
    databaseUrl.startsWith("prisma://")
  ) {
    try {
      const parsed = new URL(databaseUrl);
      const apiKey = parsed.searchParams.get("api_key");
      if (!apiKey) return undefined;

      const payload = JSON.parse(
        Buffer.from(apiKey, "base64").toString("utf-8")
      ) as { databaseUrl?: string; shadowDatabaseUrl?: string };

      return payload.databaseUrl ?? payload.shadowDatabaseUrl;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Normaliza parâmetros recomendados para Supabase (SSL + pooler).
 * @param rawUrl - URL já resolvida (postgres://...).
 * @returns URL com query string ajustada.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  // SSL é configurado no Pool `pg` (rejectUnauthorized: false), não na query string
  url.searchParams.delete("sslmode");

  if (url.port === "6543") {
    url.searchParams.set("pgbouncer", "true");
  } else {
    url.searchParams.delete("pgbouncer");
  }

  return url.toString();
}

/**
 * Deriva URL de conexão direta (5432) a partir da URL do pooler Supabase (6543).
 * @param poolerUrl - URL do Transaction pooler.
 * @returns URL direta ou undefined se não for pooler Supabase.
 */
export function deriveSupabaseDirectUrl(poolerUrl: string): string | undefined {
  try {
    const pooler = new URL(poolerUrl);
    if (!isSupabaseDatabaseUrl(pooler.hostname)) return undefined;

    const isPooler =
      pooler.port === "6543" || pooler.hostname.includes(".pooler.");

    if (!isPooler) return undefined;

    const projectRef = pooler.username?.startsWith("postgres.")
      ? pooler.username.slice("postgres.".length)
      : undefined;

    if (!projectRef) return undefined;

    const direct = new URL(poolerUrl);
    direct.username = "postgres";
    direct.hostname = `db.${projectRef}.supabase.co`;
    direct.port = "5432";
    direct.searchParams.delete("pgbouncer");
    direct.searchParams.delete("sslmode");
    return direct.toString();
  } catch {
    return undefined;
  }
}

/** URLs de banco apenas server-side (nunca `NEXT_PUBLIC_*` — expõem senha no browser). */
const SUPABASE_INTEGRATION_DATABASE_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

/** Na Vercel: pooler/Prisma URL definidos no painel (sem prefixo público). */
const SUPABASE_VERCEL_DATABASE_KEYS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

const SUPABASE_INTEGRATION_DIRECT_KEYS = [
  "DIRECT_DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEXT_PUBLIC_SUPABASE_URL_POSTGRES_URL_NON_POOLING",
] as const;

/**
 * Retorna o primeiro valor não vazio entre várias chaves de ambiente.
 * @param env - Variáveis de ambiente.
 * @param keys - Chaves em ordem de prioridade.
 * @returns Valor encontrado ou string vazia.
 */
function pickFirstEnv(env: NodeJS.ProcessEnv, keys: readonly string[]): string {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Aplica `SUPABASE_DB_PASSWORD` na URL quando definida.
 * @param url - Connection string.
 * @param env - Variáveis de ambiente.
 * @returns URL com senha injetada.
 */
function withOptionalSupabasePassword(
  url: string,
  env: NodeJS.ProcessEnv
): string {
  const plainPassword = env.SUPABASE_DB_PASSWORD?.trim();
  if (!plainPassword || !url || !isSupabaseDatabaseUrl(url)) return url;

  try {
    const parsed = new URL(resolvePostgresUrl(url) ?? url);
    // Integração Supabase↔Vercel já traz senha na URL — não sobrescrever
    if (parsed.password) return url;
  } catch {
    return url;
  }

  return injectSupabasePassword(url, plainPassword);
}

/**
 * Substitui a senha na URL quando `SUPABASE_DB_PASSWORD` está definida (evita erro de encoding na Vercel).
 * @param databaseUrl - URL com ou sem senha.
 * @param password - Senha em texto puro.
 * @returns URL com senha codificada.
 */
export function injectSupabasePassword(
  databaseUrl: string,
  password: string
): string {
  try {
    const url = new URL(resolvePostgresUrl(databaseUrl) ?? databaseUrl);
    url.password = encodeURIComponent(password);
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

/**
 * Monta URLs para Prisma CLI e para runtime da aplicação.
 * @param env - Variáveis de ambiente (process.env).
 * @returns URLs normalizadas.
 */
export function resolvePrismaDatasourceUrls(
  env: NodeJS.ProcessEnv = process.env
): PrismaDatasourceUrls {
  let raw =
    pickFirstEnv(env, SUPABASE_INTEGRATION_DATABASE_KEYS) ||
    pickFirstEnv(env, SUPABASE_INTEGRATION_DIRECT_KEYS);

  raw = withOptionalSupabasePassword(raw, env);

  if (!raw) {
    throw new Error(
      "DATABASE_URL não definida. Copie env.example para .env e configure o Supabase."
    );
  }

  const resolved = resolvePostgresUrl(raw) ?? raw;
  let runtimeUrl = isSupabaseDatabaseUrl(resolved)
    ? normalizeSupabaseUrl(resolved)
    : resolved;

  if (process.env.VERCEL === "1" && isSupabaseDatabaseUrl(resolved)) {
    const directForRuntime = withOptionalSupabasePassword(
      pickFirstEnv(env, SUPABASE_INTEGRATION_DIRECT_KEYS),
      env
    );
    const poolerForRuntime = withOptionalSupabasePassword(
      pickFirstEnv(env, SUPABASE_VERCEL_DATABASE_KEYS) || resolved,
      env
    );

    // Pooler regional (aws-0-*.pooler) retorna "tenant not found" neste projeto — não converter db.* → pooler.
    if (process.env.USE_DIRECT_DATABASE_ON_VERCEL === "1" && directForRuntime) {
      runtimeUrl = normalizeSupabaseUrl(directForRuntime);
    } else if (poolerForRuntime.includes(".pooler.")) {
      runtimeUrl = normalizeSupabaseUrl(poolerForRuntime);
    } else {
      runtimeUrl = normalizeSupabaseUrl(poolerForRuntime);
    }
  } else {
    const directFromEnvEarly = pickFirstEnv(env, [
      "DIRECT_DATABASE_URL",
      ...SUPABASE_INTEGRATION_DIRECT_KEYS,
    ]);
    const preferDirectLocally = process.env.NODE_ENV !== "production";

    if (
      preferDirectLocally &&
      directFromEnvEarly &&
      isSupabaseDatabaseUrl(directFromEnvEarly) &&
      resolved.includes(".pooler.")
    ) {
      runtimeUrl = normalizeSupabaseUrl(directFromEnvEarly);
    }
  }

  const directFromEnv = pickFirstEnv(env, [
    "DIRECT_DATABASE_URL",
    ...SUPABASE_INTEGRATION_DIRECT_KEYS,
  ]);
  const directUrl =
    directFromEnv || deriveSupabaseDirectUrl(runtimeUrl) || undefined;

  const cliBase = directUrl ?? runtimeUrl;
  let cliUrl = cliBase;

  if (isSupabaseDatabaseUrl(cliBase)) {
    try {
      const url = new URL(cliBase);
      url.searchParams.delete("pgbouncer");
      url.searchParams.delete("sslmode");
      cliUrl = url.toString();
    } catch {
      cliUrl = cliBase;
    }
  }

  return {
    url: cliUrl,
    directUrl: directUrl ?? undefined,
    runtimeUrl,
  };
}

/**
 * Indica se o projeto está configurado para Supabase (não Prisma Dev local).
 * @returns true quando DATABASE_URL aponta para Supabase.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL ?? "";
  return isSupabaseDatabaseUrl(resolvePostgresUrl(url) ?? url);
}

/** Host do session pooler Supabase (região sa-east-1 do projeto). */
const SUPABASE_SESSION_POOLER_HOST = "aws-0-sa-east-1.pooler.supabase.com";

/**
 * Converte URL direta Supabase em session pooler (porta 5432, compatível com Prisma na Vercel).
 * @param databaseUrl - URL direta ou pooler.
 * @returns URL do session pooler regional.
 */
export function toSupabaseSessionPoolerUrl(databaseUrl: string): string {
  const resolved = resolvePostgresUrl(databaseUrl) ?? databaseUrl;

  try {
    const url = new URL(resolved);
    const password = url.password ? decodeURIComponent(url.password) : "";
    let projectRef = "";

    if (url.hostname.startsWith("db.")) {
      projectRef = url.hostname.slice(3).replace(".supabase.co", "");
    } else if (url.username.startsWith("postgres.")) {
      projectRef = url.username.slice("postgres.".length);
    }

    if (!projectRef || !password) return normalizeSupabaseUrl(resolved);

    if (url.hostname.includes(".pooler.") && url.port === "5432") {
      return normalizeSupabaseUrl(resolved);
    }

    const pooler = new URL(
      `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${SUPABASE_SESSION_POOLER_HOST}:5432/postgres`
    );
    return normalizeSupabaseUrl(pooler.toString());
  } catch {
    return normalizeSupabaseUrl(resolved);
  }
}

/**
 * Converte URL direta Supabase em pooler Supavisor transaction mode (6543).
 * Preferir {@link toSupabaseSessionPoolerUrl} — o 6543 costuma falhar com Prisma neste projeto.
 * @param databaseUrl - URL direta ou pooler.
 * @returns URL do pooler transaction mode.
 */
export function toSupabaseVercelPoolerUrl(databaseUrl: string): string {
  const resolved = resolvePostgresUrl(databaseUrl) ?? databaseUrl;

  try {
    const url = new URL(resolved);
    const password = url.password ? decodeURIComponent(url.password) : "";
    let projectRef = "";

    if (url.hostname.startsWith("db.")) {
      projectRef = url.hostname.slice(3).replace(".supabase.co", "");
    } else if (url.username.startsWith("postgres.")) {
      projectRef = url.username.slice("postgres.".length);
    }

    if (!projectRef || !password) return normalizeSupabaseUrl(resolved);

    if (url.hostname.startsWith("db.") && url.port === "6543") {
      url.username = `postgres.${projectRef}`;
      url.searchParams.set("pgbouncer", "true");
      return normalizeSupabaseUrl(url.toString());
    }

    const pooler = new URL(
      `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:6543/postgres`
    );
    pooler.searchParams.set("pgbouncer", "true");
    return pooler.toString();
  } catch {
    return normalizeSupabaseUrl(resolved);
  }
}

/**
 * Opções do pool `pg` conforme o provedor da URL.
 * @param runtimeUrl - URL usada em runtime.
 * @returns Opções parciais para `new Pool()`.
 */
export function getPgPoolOptions(runtimeUrl: string): {
  max: number;
  ssl?: { rejectUnauthorized: boolean };
} {
  const isServerless = process.env.VERCEL === "1";
  const isSupabase = isSupabaseDatabaseUrl(runtimeUrl);

  return {
    max: isServerless ? 1 : isSupabase ? 3 : 3,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  };
}
