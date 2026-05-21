"use client";

import Link from "next/link";
import { Eye, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS, SALE_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildReceiptPixKey } from "@/lib/print-pix";
import { exportCommercialDocumentToPDF } from "@/utils/export";
import type { PrintCompany, PrintCustomer } from "@/utils/export";
import type { PaymentMethod, PixKeyType, SaleStatus } from "@prisma/client";

type CustomerSaleHistoryItem = {
  id: string;
  code: string;
  subtotal: number;
  discount: number;
  downPayment: number;
  total: number;
  createdAt: Date;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  installments: number;
  notes?: string | null;
  items: {
    productName: string;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
    image?: string | null;
  }[];
};

type DefaultPixKeyProp = {
  label: string;
  key: string;
  keyType: PixKeyType;
} | null;

type CustomerSalesHistoryProps = {
  company: PrintCompany;
  customer: PrintCustomer;
  sales: CustomerSaleHistoryItem[];
  defaultPixKey?: DefaultPixKeyProp;
};

/**
 * Renderiza o histórico de compras do cliente com ações de visualizar e imprimir.
 * @param props - Lista de vendas serializadas do cliente.
 * @returns Lista de compras com botões de ação.
 */
export function CustomerSalesHistory({
  company,
  customer,
  sales,
  defaultPixKey = null,
}: CustomerSalesHistoryProps) {
  /**
   * Gera o PDF da venda selecionada.
   * @param sale - Venda que será impressa.
   * @returns void
   */
  const handlePrint = async (sale: CustomerSaleHistoryItem) => {
    await exportCommercialDocumentToPDF({
      type: "Comprovante de Venda",
      code: sale.code,
      createdAt: sale.createdAt,
      company,
      customer,
      paymentMethod: PAYMENT_METHODS[sale.paymentMethod],
      pixKey: buildReceiptPixKey(
        sale.paymentMethod,
        defaultPixKey,
        company
      ),
      installments: sale.installments,
      notes: sale.notes,
      subtotal: sale.subtotal,
      discount: sale.discount,
      downPayment: sale.downPayment,
      total: sale.total,
      items: sale.items,
    });
  };

  if (sales.length === 0) {
    return (
      <p className="text-sm text-slate-500">Nenhuma compra registrada</p>
    );
  }

  return (
    <ul className="space-y-3">
      {sales.map((sale) => (
        <li
          key={sale.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
        >
          <div>
            <p className="font-medium text-slate-900">
              {formatCurrency(sale.total)}
            </p>
            <p className="text-xs text-slate-400">
              {sale.code} · {formatDate(sale.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={sale.status === "COMPLETED" ? "success" : "warning"}
            >
              {SALE_STATUS[sale.status]}
            </Badge>
            <Link href={`/vendas/${sale.id}`}>
              <Button variant="ghost" size="icon" title="Visualizar venda">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              title="Imprimir venda"
              onClick={() => handlePrint(sale)}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
