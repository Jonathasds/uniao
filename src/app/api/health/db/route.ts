import {
  checkDatabaseConnectionDetailed,
  createPrismaClient,
} from "@/lib/create-prisma-client";
import { getDatabaseOfflineShortMessage } from "@/lib/database-messages";
import {
  isSupabaseConfigured,
  isVercelDeployment,
  requireSupabaseDatasourceUrls,
} from "@/lib/database-url";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json(
      {
        ok: false,
        provider: "supabase",
        message:
          "Configure apenas Supabase no .env (DATABASE_URL e NEXT_PUBLIC_SUPABASE_*).",
      },
      { status: 503 }
    );
  }

  const result = await checkDatabaseConnectionDetailed();
  const debug = process.env.HEALTH_DB_DEBUG === "1";

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        provider: "supabase",
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
    dbHost = new URL(requireSupabaseDatasourceUrls().runtimeUrl).hostname;
  } catch {
    dbHost = "unknown";
  }

  return Response.json({
    ok: true,
    provider: "supabase",
    environment: isVercelDeployment() ? "vercel" : "local",
    dbHost,
    counts,
  });
}
