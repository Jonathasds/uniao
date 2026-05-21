import {
  checkDatabaseConnectionDetailed,
  createPrismaClient,
} from "@/lib/create-prisma-client";
import { getDatabaseOfflineShortMessage } from "@/lib/database-messages";
import {
  isSupabaseConfigured,
  isVercelDeployment,
  resolvePrismaDatasourceUrls,
} from "@/lib/database-url";

export async function GET() {
  const result = await checkDatabaseConnectionDetailed();
  const debug = process.env.HEALTH_DB_DEBUG === "1";

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        provider: isSupabaseConfigured() ? "supabase" : "local",
        message: getDatabaseOfflineShortMessage(),
        ...(debug && result.error ? { error: result.error } : {}),
      },
      { status: 503 }
    );
  }

  let counts: Record<string, number> | undefined;
  try {
    const prisma = createPrismaClient();
    const [customers, products, users] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.user.count(),
    ]);
    counts = { customers, products, users };
  } catch {
    counts = undefined;
  }

  let dbHost = "";
  try {
    dbHost = new URL(resolvePrismaDatasourceUrls().runtimeUrl).hostname;
  } catch {
    dbHost = "unknown";
  }

  return Response.json({
    ok: true,
    provider: isSupabaseConfigured() ? "supabase" : "local",
    environment: isVercelDeployment() ? "vercel" : "local",
    dbHost,
    counts,
  });
}
