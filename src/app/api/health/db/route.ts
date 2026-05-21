import { checkDatabaseConnectionDetailed } from "@/lib/create-prisma-client";
import { getDatabaseOfflineShortMessage } from "@/lib/database-messages";
import { isSupabaseConfigured } from "@/lib/database-url";

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

  return Response.json({
    ok: true,
    provider: isSupabaseConfigured() ? "supabase" : "local",
  });
}
