import { checkDatabaseConnection } from "@/lib/create-prisma-client";
import { getDatabaseOfflineShortMessage } from "@/lib/database-messages";
import { isSupabaseConfigured } from "@/lib/database-url";

export async function GET() {
  const ok = await checkDatabaseConnection();

  if (!ok) {
    return Response.json(
      {
        ok: false,
        provider: isSupabaseConfigured() ? "supabase" : "local",
        message: getDatabaseOfflineShortMessage(),
      },
      { status: 503 }
    );
  }

  return Response.json({
    ok: true,
    provider: isSupabaseConfigured() ? "supabase" : "local",
  });
}
