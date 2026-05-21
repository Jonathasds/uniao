import { auth } from "@/lib/auth";
import { isPrismaRecordNotFound } from "@/lib/prisma-errors";
import { touchUserPresence } from "@/services/presence.service";

/**
 * Atualiza o último acesso do usuário autenticado (heartbeat).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const lastSeenAt = await touchUserPresence(session.user.id);
    return Response.json({
      ok: true,
      lastSeenAt: lastSeenAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (isPrismaRecordNotFound(error)) {
      return Response.json(
        { error: "Sessão expirada. Faça login novamente.", needsReauth: true },
        { status: 401 }
      );
    }

    return Response.json({ error: "Erro ao registrar presença" }, { status: 500 });
  }
}
