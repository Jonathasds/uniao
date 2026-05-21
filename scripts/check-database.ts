/**
 * Testa conexão com o banco configurado em DATABASE_URL.
 * Uso: npm run db:check
 */
import "dotenv/config";
import {
  checkDatabaseConnection,
  createPrismaClient,
  resetPrismaConnection,
} from "../src/lib/create-prisma-client";
import {
  isSupabaseDatabaseUrl,
  isVercelDeployment,
  resolvePrismaDatasourceUrls,
} from "../src/lib/database-url";

async function main() {
  if (process.env.VERCEL === "1" && !isVercelDeployment(process.env)) {
    console.warn(
      "Aviso: VERCEL=1 no terminal (ex.: vercel env run). Isso quebra o dev local.\n" +
        "       Feche o terminal ou rode: npm run dev (limpa VERCEL automaticamente).\n"
    );
  }

  const urls = resolvePrismaDatasourceUrls(process.env);
  const provider = isSupabaseDatabaseUrl(urls.runtimeUrl) ? "Supabase" : "PostgreSQL";

  console.log(`Provedor detectado: ${provider}`);
  console.log(`Ambiente: ${isVercelDeployment(process.env) ? "Vercel" : "local"}`);
  console.log(`Runtime (app): ${maskUrl(urls.runtimeUrl)}`);
  if (urls.directUrl) {
    console.log(`Direct (Prisma CLI): ${maskUrl(urls.directUrl)}`);
  }

  const ok = await checkDatabaseConnection();
  if (!ok) {
    console.error("\nFalha na conexão. Confira DATABASE_URL e docs/SUPABASE.md");
    process.exit(1);
  }

  const prisma = createPrismaClient();
  const users = await prisma.user.count();
  console.log(`\nConexão OK. Usuários no banco: ${users}`);

  if (users === 0) {
    console.log("Dica: rode npm run db:setup para criar tabelas e dados de teste.");
  }

  await prisma.$disconnect();
  await resetPrismaConnection();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    void resetPrismaConnection().finally(() => process.exit(1));
  });

/**
 * Oculta senha na URL para exibição no terminal.
 * @param url - Connection string.
 * @returns URL mascarada.
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ":****@");
  }
}

