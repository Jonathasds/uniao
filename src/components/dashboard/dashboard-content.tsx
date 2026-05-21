"use client";

import {
  DollarSign,
  ShoppingBag,
  FileText,
  Users,
  Settings,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SALE_STATUS } from "@/lib/constants";
import { canAccessRoute } from "@/lib/permissions";
import type { SaleWithRelations } from "@/types";
import type { UserRole } from "@prisma/client";

type DashboardContentProps = {
  userRole: UserRole;
  stats: {
    monthlySales: number;
    salesGrowth: number;
    openOrders: number;
    pendingQuotes: number;
    openServiceOrders: number;
    totalCustomers: number;
    chartYear: number;
    chartMonth: number;
    chartPreviousYear: number;
    chartMinYear: number;
    chartMaxYear: number;
    monthlySalesComparison: {
      month: string;
      previousMonth: string;
      monthFull: string;
      total: number;
      previousTotal: number;
    };
    recentSales: SaleWithRelations[];
  };
};

export function DashboardContent({ stats, userRole }: DashboardContentProps) {
  const canServicos = canAccessRoute(userRole, "/servicos");
  const canVendas = canAccessRoute(userRole, "/vendas");
  const canOrcamentos = canAccessRoute(userRole, "/orcamentos");
  const canClientes = canAccessRoute(userRole, "/clientes");
  const canRelatorios = canAccessRoute(userRole, "/relatorios");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 [&>*]:h-full">
        <StatCard
          title="Vendas do Mês"
          value={formatCurrency(stats.monthlySales)}
          icon={DollarSign}
          trend={{ value: stats.salesGrowth, label: "vs mês anterior" }}
          href={canVendas ? "/vendas" : undefined}
        />
        <StatCard
          title="Pedidos Abertos"
          value={stats.openOrders}
          icon={ShoppingBag}
          href={canVendas ? "/vendas" : undefined}
        />
        <StatCard
          title="Orçamentos Pendentes"
          value={stats.pendingQuotes}
          icon={FileText}
          subtitle="Aguardando aprovação"
          href={canOrcamentos ? "/orcamentos" : undefined}
        />
        <StatCard
          title="Serviços em Aberto"
          value={stats.openServiceOrders}
          icon={Settings}
          subtitle="Abertas e em andamento"
          href={canServicos ? "/servicos" : undefined}
        />
        <StatCard
          title="Clientes"
          value={stats.totalCustomers}
          icon={Users}
          href={canClientes ? "/clientes" : undefined}
        />
        <StatCard
          title="Crescimento"
          value={`${stats.salesGrowth}%`}
          icon={TrendingUp}
          subtitle="Comparativo mensal"
          href={canRelatorios ? "/relatorios" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Vendas</CardTitle>
          <CardDescription>
            Um mês por vez · comparado com o mesmo mês do ano anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart
            comparison={stats.monthlySalesComparison}
            year={stats.chartYear}
            month={stats.chartMonth}
            previousYear={stats.chartPreviousYear}
            minYear={stats.chartMinYear}
            maxYear={stats.chartMaxYear}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.openServiceOrders > 0 ? (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                <Settings className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {stats.openServiceOrders} serviço(s) em aberto
                  </p>
                  <p className="text-xs text-amber-600">
                    Verifique o módulo de serviços
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Nenhum alerta no momento
              </p>
            )}
            {stats.openOrders > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                <ShoppingBag className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {stats.openOrders} pedido(s) pendente(s)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={stats.recentSales}
            emptyMessage="Nenhuma venda registrada"
            columns={[
              {
                key: "code",
                header: "Código",
                cell: (s) => (
                  <span className="font-medium text-primary">{s.code}</span>
                ),
              },
              {
                key: "customer",
                header: "Cliente",
                cell: (s) => s.customer.name,
              },
              {
                key: "total",
                header: "Total",
                cell: (s) => formatCurrency(toNumber(s.total)),
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
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
