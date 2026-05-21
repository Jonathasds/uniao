"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getRoleError } from "@/lib/auth-helpers";
import { SERVICE_ROLES } from "@/lib/permissions";
import { updateServiceOrderStatus } from "@/services/service-order.service";
import type { ServiceOrderStatus } from "@prisma/client";

/**
 * Atualiza o status de uma ordem de serviço.
 * @param id - ID da ordem de serviço.
 * @param status - Novo status da ordem.
 * @returns Resultado da atualização.
 */
export async function updateServiceOrderStatusAction(
  id: string,
  status: ServiceOrderStatus
) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, SERVICE_ROLES);
  if (roleError) return { error: roleError };

  try {
    await updateServiceOrderStatus(id, status, session.user.id);
    revalidatePath("/servicos");
    revalidatePath(`/servicos/${id}`);
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar ordem de serviço" };
  }
}
