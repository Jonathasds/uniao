"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { buildReceiptPixKey } from "@/lib/print-pix";
import { exportCommercialDocumentToPDF } from "@/utils/export";
import type { SaleWithRelations } from "@/types";
import type { PrintCompany } from "@/utils/export";
import type { PixKeyType } from "@prisma/client";

type DefaultPixKeyProp = {
  label: string;
  key: string;
  keyType: PixKeyType;
} | null;

type SaleReceiptProps = {
  sale: SaleWithRelations;
  company: PrintCompany;
  defaultPixKey?: DefaultPixKeyProp;
};

/**
 * Botão para gerar comprovante PDF da venda.
 * @param props - Dados da venda e da empresa.
 * @returns Botão de impressão do comprovante.
 */
export function SaleReceipt({ sale, company, defaultPixKey }: SaleReceiptProps) {
  const handlePrint = async () => {
    await exportCommercialDocumentToPDF({
      type: "Comprovante de Venda",
      code: sale.code,
      createdAt: sale.createdAt,
      company,
      customer: sale.customer,
      paymentMethod: PAYMENT_METHODS[sale.paymentMethod],
      pixKey: buildReceiptPixKey(sale.paymentMethod, defaultPixKey ?? null, company),
      installments: sale.installments,
      notes: sale.notes,
      subtotal: sale.subtotal,
      discount: sale.discount,
      downPayment: sale.downPayment,
      total: sale.total,
      items: sale.items.map((item) => ({
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        image: item.product.image,
      })),
    });
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="h-4 w-4" />
      Comprovante PDF
    </Button>
  );
}
