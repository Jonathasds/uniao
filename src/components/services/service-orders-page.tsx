"use client";

import Link from "next/link";
import { Eye, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { UserAttribution } from "@/components/shared/user-attribution";
import { SERVICE_ORDER_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ServiceOrderWithRelations } from "@/types";

type ServiceOrdersPageProps = {
  orders: ServiceOrderWithRelations[];
  totalPages: number;
  currentPage: number;
};

/**
 * Retorna a variante visual do badge conforme o status da ordem.
 * @param status - Status atual da ordem de serviço.
 * @returns Nome da variante do badge.
 */
function statusVariant(status: ServiceOrderWithRelations["status"]) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "IN_PROGRESS") return "warning";
  return "secondary";
}

/**
 * Renderiza a listagem paginada de ordens de serviço.
 * @param props - Dados iniciais e paginação da listagem.
 * @returns Página de ordens de serviço.
 */
export function ServiceOrdersPage({
  orders,
  totalPages,
  currentPage,
}: ServiceOrdersPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Serviços</h1>
          <p className="text-sm text-slate-500">
            Ordens de serviço geradas a partir das vendas finalizadas
          </p>
        </div>
      </div>

      <DataTable
        data={orders}
        emptyMessage="Nenhuma ordem de serviço encontrada"
        columns={[
          {
            key: "code",
            header: "OS",
            cell: (order) => (
              <span className="font-medium text-primary">{order.code}</span>
            ),
          },
          {
            key: "sale",
            header: "Venda",
            cell: (order) => order.sale.code,
          },
          {
            key: "customer",
            header: "Cliente",
            cell: (order) => order.customer.name,
          },
          {
            key: "total",
            header: "Valor",
            cell: (order) => formatCurrency(order.sale.total),
          },
          {
            key: "status",
            header: "Status",
            cell: (order) => (
              <Badge variant={statusVariant(order.status)}>
                {SERVICE_ORDER_STATUS[order.status]}
              </Badge>
            ),
          },
          {
            key: "startedBy",
            header: "Iniciado por",
            cell: (order) =>
              order.startedBy ? (
                <UserAttribution
                  name={order.startedBy.name}
                  role={order.startedBy.role}
                />
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "completedBy",
            header: "Concluído por",
            cell: (order) =>
              order.completedBy ? (
                <UserAttribution
                  name={order.completedBy.name}
                  role={order.completedBy.role}
                />
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "date",
            header: "Criada em",
            cell: (order) => formatDate(order.createdAt),
          },
          {
            key: "actions",
            header: "",
            cell: (order) => (
              <Link href={`/servicos/${order.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            ),
          },
        ]}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          window.location.href = `/servicos?page=${page}`;
        }}
      />
    </div>
  );
}
