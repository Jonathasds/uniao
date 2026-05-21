import type { QuoteStatus, SaleStatus } from "@prisma/client";

const SALE_ROW_BG: Record<SaleStatus, string> = {
  PENDING: "bg-orange-50 hover:bg-orange-100/80",
  COMPLETED: "bg-emerald-50 hover:bg-emerald-100/80",
  CANCELLED: "bg-red-50 hover:bg-red-100/80",
};

const QUOTE_ROW_BG: Record<QuoteStatus, string> = {
  PENDING: "bg-orange-50 hover:bg-orange-100/80",
  APPROVED: "bg-emerald-50 hover:bg-emerald-100/80",
  CANCELLED: "bg-red-50 hover:bg-red-100/80",
};

/**
 * Classes de fundo da linha na listagem de vendas conforme o status.
 * @param status - Status da venda (pendente, concluída ou cancelada).
 * @returns Classes Tailwind para o `<tr>`.
 */
export function getSaleRowBackgroundClass(status: SaleStatus): string {
  return SALE_ROW_BG[status];
}

/**
 * Classes de fundo da linha na listagem de orçamentos conforme o status.
 * @param status - Status do orçamento (pendente, aprovado ou cancelado).
 * @returns Classes Tailwind para o `<tr>`.
 */
export function getQuoteRowBackgroundClass(status: QuoteStatus): string {
  return QUOTE_ROW_BG[status];
}
