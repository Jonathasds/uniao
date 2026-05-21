"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { QUOTE_STATUS } from "@/lib/constants";
import { UserAttribution } from "@/components/shared/user-attribution";
import { toast } from "sonner";
import { prepareQuoteSaleAction } from "@/app/actions/quotes";
import { exportCommercialDocumentToPDF } from "@/utils/export";
import type { PrintCompany } from "@/utils/export";
import type { QuoteWithRelations } from "@/types";

type QuotesPageProps = {
  company: PrintCompany;
  quotes: QuoteWithRelations[];
  totalPages: number;
  currentPage: number;
};

export function QuotesPage({
  company,
  quotes,
  totalPages,
  currentPage,
}: QuotesPageProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleApproveForSale = (id: string) => {
    startTransition(async () => {
      const result = await prepareQuoteSaleAction(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Orçamento aprovado. Revise a venda antes de finalizar.");
        router.push(`/vendas/nova?saleId=${result.saleId}`);
      }
    });
  };

  const handlePDF = async (quote: QuoteWithRelations) => {
    await exportCommercialDocumentToPDF({
      type: "Orçamento",
      code: quote.code,
      createdAt: quote.createdAt,
      company,
      customer: quote.customer,
      notes: quote.notes,
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      items: quote.items.map((item) => ({
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        total: toNumber(item.total),
        image: item.product.image,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-sm text-slate-500">Crie e gerencie orçamentos</p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <DataTable
        data={quotes}
        columns={[
          {
            key: "code",
            header: "Código",
            cell: (q) => (
              <span className="font-medium text-primary">{q.code}</span>
            ),
          },
          { key: "customer", header: "Cliente", cell: (q) => q.customer.name },
          {
            key: "user",
            header: "Responsável",
            cell: (q) => (
              <UserAttribution
                name={q.user.name}
                role={q.user.role}
                className="text-sm"
              />
            ),
          },
          {
            key: "total",
            header: "Total",
            cell: (q) => formatCurrency(toNumber(q.total)),
          },
          {
            key: "status",
            header: "Status",
            cell: (q) => (
              <Badge
                variant={
                  q.status === "APPROVED"
                    ? "success"
                    : q.status === "PENDING"
                      ? "warning"
                      : "danger"
                }
              >
                {QUOTE_STATUS[q.status]}
              </Badge>
            ),
          },
          {
            key: "date",
            header: "Data",
            cell: (q) => formatDate(q.createdAt),
          },
          {
            key: "actions",
            header: "",
            cell: (q) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePDF(q)}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                {q.status === "PENDING" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => handleApproveForSale(q.id)}
                    title="Aprovar e abrir venda"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          window.location.href = `/orcamentos?page=${p}`;
        }}
      />
    </div>
  );
}
