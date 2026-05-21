/**
 * Configura Supabase Storage: bucket `uploads`, políticas, .env e Vercel.
 * Uso:
 *   npm run supabase:storage:setup
 *   npm run supabase:storage:setup -- --service-role=CHAVE_SERVICE_ROLE
 * Opcional em .env.supabase: SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ACCESS_TOKEN (Management API).
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";
import { createPrismaClient, resetPrismaConnection } from "../src/lib/create-prisma-client";
import { DEFAULT_STORAGE_BUCKET } from "../src/utils/supabase/storage";
import {
  isInvalidServiceRoleKey,
  getServiceRoleKeyHelpMessage,
} from "../src/utils/supabase/service-role-key";

const PROJECT_REF = "gvxtzvcxjodpyvaxiqqn";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;

config({ path: ".env" });
config({ path: ".env.supabase", override: true });

/**
 * Lê valor de .env.supabase ou argumento --chave=valor.
 * @param key - Nome da variável.
 * @returns Valor ou undefined.
 */
function resolveSecret(key: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${key.toLowerCase().replace(/_/g, "-")}=`));
  if (arg) {
    const prefix = `--${key.toLowerCase().replace(/_/g, "-")}=`;
    return arg.slice(prefix.length).trim();
  }

  const fromEnv = process.env[key]?.trim();
  if (fromEnv) return fromEnv;

  const supabaseEnvPath = resolve(process.cwd(), ".env.supabase");
  if (!existsSync(supabaseEnvPath)) return undefined;

  const content = readFileSync(supabaseEnvPath, "utf-8");
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "m"));
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Busca service_role na Management API do Supabase.
 * @param accessToken - Personal access token (dashboard → Account → Tokens).
 * @returns Chave service_role ou undefined.
 */
async function fetchServiceRoleFromApi(
  accessToken: string
): Promise<string | undefined> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    console.warn(`Management API: ${res.status} ${await res.text()}`);
    return undefined;
  }

  const data = (await res.json()) as Array<{
    name?: string;
    type?: string;
    api_key?: string;
  }>;

  const row = data.find(
    (k) =>
      k.name === "service_role" ||
      k.type === "service_role" ||
      (k.name ?? "").toLowerCase().includes("service")
  );

  return row?.api_key?.trim();
}

/**
 * Atualiza ou insere variáveis no .env local.
 * @param entries - Pares chave/valor.
 * @returns void
 */
function updateEnvFile(entries: Record<string, string>) {
  const envPath = resolve(process.cwd(), ".env");
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

/**
 * Cria bucket e políticas de Storage via SQL (Postgres Supabase).
 * @returns void
 */
async function ensureBucketAndPolicies() {
  const prisma = createPrismaClient();

  await prisma.$executeRawUnsafe(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      '${BUCKET}',
      '${BUCKET}',
      true,
      2097152,
      ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  `);

  const policies = [
    {
      name: "uniao_uploads_public_read",
      sql: `CREATE POLICY "uniao_uploads_public_read"
        ON storage.objects FOR SELECT
        USING (bucket_id = '${BUCKET}');`,
    },
    {
      name: "uniao_uploads_authenticated_insert",
      sql: `CREATE POLICY "uniao_uploads_authenticated_insert"
        ON storage.objects FOR INSERT
        TO authenticated, anon
        WITH CHECK (bucket_id = '${BUCKET}');`,
    },
    {
      name: "uniao_uploads_authenticated_update",
      sql: `CREATE POLICY "uniao_uploads_authenticated_update"
        ON storage.objects FOR UPDATE
        TO authenticated, anon
        USING (bucket_id = '${BUCKET}');`,
    },
  ];

  for (const policy of policies) {
    try {
      await prisma.$executeRawUnsafe(policy.sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) continue;
      console.warn(`Política ${policy.name}:`, message);
    }
  }

  await resetPrismaConnection();
}

/**
 * Sincroniza variáveis de Storage na Vercel (Production).
 * @param serviceRole - Chave service_role (opcional).
 * @returns void
 */
function syncVercelEnv(serviceRole?: string) {
  const add = (key: string, value: string) => {
    console.log(`→ Vercel: ${key}`);
    spawnSync("npx", ["vercel", "env", "rm", key, "production", "--yes"], {
      stdio: "ignore",
      shell: true,
    });
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", key, "production", "--yes"],
      {
        input: value,
        encoding: "utf-8",
        shell: true,
      }
    );
    if (result.status !== 0) {
      console.warn(`  Falha ao definir ${key} na Vercel`);
    }
  };

  add("SUPABASE_STORAGE_BUCKET", BUCKET);
  if (serviceRole) {
    add("SUPABASE_SERVICE_ROLE_KEY", serviceRole);
  }
}

async function main() {
  console.log("→ Criando bucket e políticas no Supabase (SQL)...");
  await ensureBucketAndPolicies();
  console.log(`✓ Bucket "${BUCKET}" (público) pronto.`);

  let serviceRole =
    resolveSecret("SUPABASE_SERVICE_ROLE_KEY") ??
    (await (async () => {
      const token = resolveSecret("SUPABASE_ACCESS_TOKEN");
      if (!token) return undefined;
      return fetchServiceRoleFromApi(token);
    })());

  const argService = process.argv.find((a) => a.startsWith("--service-role="));
  if (argService) {
    serviceRole = argService.slice("--service-role=".length).trim();
  }

  updateEnvFile({
    SUPABASE_STORAGE_BUCKET: BUCKET,
    ...(serviceRole ? { SUPABASE_SERVICE_ROLE_KEY: serviceRole } : {}),
  });

  if (serviceRole && isInvalidServiceRoleKey(serviceRole)) {
    console.error(`✗ ${getServiceRoleKeyHelpMessage()}`);
    process.exit(1);
  }

  if (serviceRole) {
    console.log("✓ SUPABASE_SERVICE_ROLE_KEY gravada no .env e na Vercel");
  } else {
    console.error(
      "✗ SUPABASE_SERVICE_ROLE_KEY obrigatória para uploads (segurança no servidor)."
    );
    console.error(
      "  Painel: Project Settings → API → service_role"
    );
    console.error(
      "  Depois: npm run supabase:storage:setup -- --service-role=SUA_CHAVE"
    );
    process.exit(1);
  }

  console.log("\n→ Sincronizando Vercel (Production)...");
  syncVercelEnv(serviceRole!);

  console.log("\nPronto. Reenvie logo e avatar em Configurações / perfil.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
