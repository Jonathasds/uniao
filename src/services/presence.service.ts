import { prisma } from "@/lib/prisma";
import { isUserOnline } from "@/lib/presence";
import { userModelSupportsLastSeenAt } from "@/lib/prisma-user-presence";

/**
 * Registra atividade do usuário (heartbeat) para monitoramento de presença.
 * @param userId - ID do usuário autenticado.
 * @returns Data/hora registrada.
 */
export async function touchUserPresence(userId: string) {
  if (!userModelSupportsLastSeenAt()) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
    select: { lastSeenAt: true },
  });
  return user.lastSeenAt;
}

/**
 * Lista status online/offline de todos os usuários.
 * @returns Mapa id → online.
 */
export async function getUsersPresenceStatus() {
  const supportsPresence = userModelSupportsLastSeenAt();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      ...(supportsPresence ? { lastSeenAt: true } : {}),
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => {
    const lastSeenAt =
      supportsPresence && "lastSeenAt" in user
        ? (user.lastSeenAt as Date | null)
        : null;

    return {
      id: user.id,
      online: isUserOnline(lastSeenAt),
      lastSeenAt: lastSeenAt?.toISOString() ?? null,
    };
  });
}
