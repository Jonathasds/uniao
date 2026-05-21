import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceOrderStatusActions } from "@/components/services/service-order-status-actions";
import { SERVICE_ORDER_STATUS } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { UserAttribution } from "@/components/shared/user-attribution";
import { getServiceOrderById } from "@/services/service-order.service";
import type { ServiceOrderWithRelations } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
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
 * Renderiza os detalhes de uma ordem de serviço.
 * @param props - Parâmetros da rota com ID da OS.
 * @returns Página de detalhe da ordem de serviço.
 */
export default async function ServicoDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getServiceOrderById(id);

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/servicos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{order.code}</h1>
            <p className="text-sm text-slate-500">
              Gerada pela venda {order.sale.code}
            </p>
          </div>
        </div>
        <ServiceOrderStatusActions orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {order.sale.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      SKU {item.product.sku} · Qtd {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da OS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <Badge variant={statusVariant(order.status)}>
                  {SERVICE_ORDER_STATUS[order.status]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-medium text-slate-900">
                  {order.customer.name}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 text-slate-500">Iniciado por</span>
                {order.startedBy ? (
                  <UserAttribution
                    name={order.startedBy.name}
                    role={order.startedBy.role}
                    className="text-right sm:text-right"
                  />
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 text-slate-500">Concluído por</span>
                {order.completedBy ? (
                  <UserAttribution
                    name={order.completedBy.name}
                    role={order.completedBy.role}
                    className="text-right sm:text-right"
                  />
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Criada em</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Concluída em</span>
                  <span>{formatDateTime(order.completedAt)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold">
                <span>Total da venda</span>
                <span className="text-primary">
                  {formatCurrency(order.sale.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {order.description ?? "Sem observações para esta ordem."}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
