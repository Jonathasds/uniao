"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { verifyAdminPassword, getRoleError } from "@/lib/auth-helpers";
import { SALES_ROLES } from "@/lib/permissions";
import { completePendingSale, createSale } from "@/services/sale.service";
import { updateQuoteStatus } from "@/services/quote.service";
import type { PaymentMethod, SaleStatus } from "@prisma/client";

export async function createSaleAction(data: {
  saleId?: string;
  customerId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  discount: number;
  downPayment?: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  status: SaleStatus;
  quoteId?: string;
  notes?: string;
  adminPassword?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };

  const roleError = getRoleError(session.user.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  if (
    session.user.role === "MANAGER" &&
    data.saleId &&
    (!data.adminPassword || !(await verifyAdminPassword(data.adminPassword)))
  ) {
    return { error: "Senha do administrador incorreta" };
  }

  if (!data.items.length) return { error: "Adicione pelo menos um produto" };

  try {
    const sale = data.saleId
      ? await completePendingSale({
          ...data,
          saleId: data.saleId,
          userId: session.user.id,
        })
      : await createSale({
          ...data,
          userId: session.user.id,
        });

    if (data.quoteId) {
      await updateQuoteStatus(data.quoteId, "APPROVED");
      revalidatePath("/orcamentos");
    }

    revalidatePath("/vendas");
    revalidatePath("/");
    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/servicos");
    const serviceOrderId =
      "serviceOrder" in sale &&
      sale.serviceOrder &&
      typeof sale.serviceOrder === "object" &&
      "id" in sale.serviceOrder
        ? String(sale.serviceOrder.id)
        : undefined;

    return {
      success: true,
      saleId: sale.id,
      serviceOrderId,
      code: sale.code,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar venda" };
  }
}
