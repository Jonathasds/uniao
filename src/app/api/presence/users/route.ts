import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getUsersPresenceStatus } from "@/services/presence.service";

/**
 * Retorna status online/offline de todos os usuários (somente administrador).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !canManageUsers(session.user.role)) {
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const users = await getUsersPresenceStatus();
    return Response.json({ users });
  } catch {
    return Response.json({ error: "Erro ao buscar presença" }, { status: 500 });
  }
}
