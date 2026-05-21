"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getRoleError } from "@/lib/auth-helpers";
import { SALES_ROLES } from "@/lib/permissions";
import {
  createQuote,
  updateQuoteStatus,
  convertQuoteToSale,
} from "@/services/quote.service";
import { createPendingSaleFromQuote } from "@/services/sale.service";
import type { PaymentMethod, QuoteStatus } from "@prisma/client";

export async function createQuoteAction(data: {
  customerId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  discount: number;
  validUntil?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  try {
    const quote = await createQuote({
      customerId: data.customerId,
      userId: session.user.id,
      items: data.items,
      discount: data.discount,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
    });
    revalidatePath("/orcamentos");
    return { success: true, quoteId: quote.id };
  } catch {
    return { error: "Erro ao criar orçamento" };
  }
}

export async function updateQuoteStatusAction(id: string, status: QuoteStatus) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  try {
    await updateQuoteStatus(id, status);
    revalidatePath("/orcamentos");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar status" };
  }
}

export async function convertQuoteAction(
  quoteId: string,
  paymentMethod: PaymentMethod = "PIX"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  try {
    const sale = await convertQuoteToSale(
      quoteId,
      session.user.id,
      paymentMethod
    );
    revalidatePath("/orcamentos");
    revalidatePath("/vendas");
    revalidatePath("/");
    return { success: true, saleId: sale.id, code: sale.code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao converter" };
  }
}

/**
 * Aprova o orçamento e cria/reutiliza uma venda pendente para finalização.
 * @param quoteId - ID do orçamento que será preparado para venda.
 * @returns ID da venda pendente criada ou reutilizada.
 */
export async function prepareQuoteSaleAction(quoteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  try {
    const sale = await createPendingSaleFromQuote(quoteId, session.user.id);
    revalidatePath("/orcamentos");
    revalidatePath("/vendas");
    return { success: true, saleId: sale.id, code: sale.code };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Erro ao preparar venda do orçamento",
    };
  }
}
