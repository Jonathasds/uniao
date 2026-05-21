import { prisma } from "@/lib/prisma";
import { isUserOnline } from "@/lib/presence";
import { userModelSupportsLastSeenAt } from "@/lib/prisma-user-presence";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

export async function getCompanySettings() {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { name: "Minha Empresa" },
    });
  }
  return settings;
}

export async function updateCompanySettings(data: {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  lowStockAlert?: number;
}) {
  const existing = await getCompanySettings();
  return prisma.companySettings.update({
    where: { id: existing.id },
    data,
  });
}

export async function getUsers() {
  const supportsPresence = userModelSupportsLastSeenAt();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
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
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      isOnline: isUserOnline(lastSeenAt),
    };
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { ...data, password: hashed },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}

/**
 * Atualiza a foto de perfil do usuário logado.
 * @param userId - ID do usuário.
 * @param image - Caminho público da imagem salva.
 * @returns Usuário atualizado.
 */
export async function updateUserImage(userId: string, image: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { image },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    active?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  } else {
    delete updateData.password;
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}

/**
 * Exclui um usuário ou desativa se houver histórico no sistema.
 * @param id - ID do usuário a remover.
 * @param actorId - ID do administrador que executa a ação.
 * @returns Indica se o usuário foi desativado em vez de removido.
 */
export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) {
    throw new Error("Você não pode excluir sua própria conta");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          sales: true,
          quotes: true,
          stockMovements: true,
          serviceOrders: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (user.role === "ADMIN" && user.active) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true },
    });
    if (activeAdmins <= 1) {
      throw new Error("Não é possível excluir o único administrador ativo");
    }
  }

  const hasHistory =
    user._count.sales > 0 ||
    user._count.quotes > 0 ||
    user._count.stockMovements > 0 ||
    user._count.serviceOrders > 0;

  if (hasHistory) {
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    return { deactivated: true };
  }

  await prisma.$transaction([
    prisma.serviceOrder.updateMany({
      where: { startedById: id },
      data: { startedById: null },
    }),
    prisma.serviceOrder.updateMany({
      where: { completedById: id },
      data: { completedById: null },
    }),
    prisma.user.delete({ where: { id } }),
  ]);

  return { deactivated: false };
}
