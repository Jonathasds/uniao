"use client";

import Link from "next/link";
import { Plus, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { PAYMENT_METHODS, SALE_STATUS } from "@/lib/constants";
import { UserAttribution } from "@/components/shared/user-attribution";
import type { SaleWithRelations } from "@/types";

type SalesPageProps = {
  sales: SaleWithRelations[];
  totalPages: number;
  currentPage: number;
};

export function SalesPage({ sales, totalPages, currentPage }: SalesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-sm text-slate-500">Histórico e gestão de vendas</p>
        </div>
        <Link href="/vendas/nova">
          <Button>
            <Plus className="h-4 w-4" />
            Nova Venda
          </Button>
        </Link>
      </div>

      <DataTable
        data={sales}
        columns={[
          {
            key: "code",
            header: "Código",
            cell: (s) => (
              <span className="font-medium text-primary">{s.code}</span>
            ),
          },
          { key: "customer", header: "Cliente", cell: (s) => s.customer.name },
          {
            key: "user",
            header: "Responsável",
            cell: (s) => (
              <UserAttribution
                name={s.user.name}
                role={s.user.role}
                className="text-sm"
              />
            ),
          },
          {
            key: "total",
            header: "Total",
            cell: (s) => formatCurrency(toNumber(s.total)),
          },
          {
            key: "payment",
            header: "Pagamento",
            cell: (s) =>
              s.paymentMethod === "CREDIT_CARD" && s.installments > 1
                ? `${PAYMENT_METHODS[s.paymentMethod]} (${s.installments}x)`
                : PAYMENT_METHODS[s.paymentMethod],
          },
          {
            key: "status",
            header: "Status",
            cell: (s) => (
              <Badge
                variant={
                  s.status === "COMPLETED"
                    ? "success"
                    : s.status === "PENDING"
                      ? "warning"
                      : "danger"
                }
              >
                {SALE_STATUS[s.status]}
              </Badge>
            ),
          },
          {
            key: "date",
            header: "Data",
            cell: (s) => formatDate(s.createdAt),
          },
          {
            key: "actions",
            header: "",
            cell: (s) => (
              <div className="flex items-center justify-end gap-1">
                {s.status === "PENDING" && (
                  <Link href={`/vendas/nova?saleId=${s.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Finalizar
                    </Button>
                  </Link>
                )}
                <Link href={`/vendas/${s.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          window.location.href = `/vendas?page=${p}`;
        }}
      />
    </div>
  );
}
