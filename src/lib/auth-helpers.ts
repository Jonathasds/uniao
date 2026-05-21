import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { hasRole } from "@/lib/permissions";

/**
 * Verifica a senha informada contra algum administrador ativo.
 * @param password - Senha digitada pelo gerente.
 * @returns true se coincidir com um administrador.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { password: true },
  });

  for (const admin of admins) {
    if (await bcrypt.compare(password, admin.password)) {
      return true;
    }
  }

  return false;
}

/**
 * Garante que a sessão possui um dos perfis permitidos.
 * @param role - Perfil do usuário logado.
 * @param allowed - Perfis aceitos para a operação.
 * @returns Mensagem de erro ou null quando autorizado.
 */
export function getRoleError(
  role: UserRole | undefined,
  allowed: UserRole[]
): string | null {
  if (!role || !hasRole(role, allowed)) {
    return "Sem permissão para esta operação";
  }
  return null;
}
