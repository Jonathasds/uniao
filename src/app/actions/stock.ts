"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getRoleError } from "@/lib/auth-helpers";
import { ADMIN_ROLES } from "@/lib/permissions";
import { createStockMovement } from "@/services/stock.service";
import type { StockMovementType } from "@prisma/client";

export async function createStockMovementAction(data: {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user.role, ADMIN_ROLES);
  if (roleError) return { error: roleError };

  try {
    await createStockMovement({
      ...data,
      userId: session.user.id,
    });
    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro na movimentação" };
  }
}
