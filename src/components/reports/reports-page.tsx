"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToPDF, exportToExcel } from "@/utils/export";
import { formatCurrency } from "@/lib/utils";

type ReportsPageProps = {
  topProducts: { product: { name: string }; quantity: number }[];
  topCustomers: {
    customer: { name: string };
    total: number;
    count: number;
  }[];
  monthlyRevenue: {
    month: number;
    revenue: number;
  }[];
};

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function ReportsPage({
  topProducts,
  topCustomers,
  monthlyRevenue,
}: ReportsPageProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const exportProducts = async () => {
    await exportToExcel(
      topProducts.map((p) => ({
        Produto: p.product.name,
        Quantidade: p.quantity,
      })),
      "produtos-mais-vendidos"
    );
  };

  const exportCustomers = async () => {
    await exportToPDF(
      "Top Clientes",
      ["Cliente", "Compras", "Total"],
      topCustomers.map((c) => [
        c.customer.name,
        c.count,
        formatCurrency(c.total),
      ]),
      "top-clientes"
    );
  };

  const exportRevenue = async () => {
    await exportToExcel(
      monthlyRevenue.map((m) => ({
        Mês: MONTHS[m.month - 1],
        Receita: m.revenue,
      })),
      "receita-mensal"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-sm text-slate-500">Análises e exportações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = `/api/reports/sales?start=${startDate}&end=${endDate}`)
              }
              disabled={!startDate || !endDate}
            >
              <FileDown className="h-4 w-4" />
              Exportar Vendas
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <Button variant="outline" size="sm" onClick={exportProducts}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topProducts.map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm"
                >
                  <span>{p.product.name}</span>
                  <span className="font-medium">{p.quantity} un.</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Clientes</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCustomers}>
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topCustomers.map((c, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm"
                >
                  <span>{c.customer.name}</span>
                  <span className="font-medium">
                    {formatCurrency(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Receita Mensal ({new Date().getFullYear()})</CardTitle>
          <Button variant="outline" size="sm" onClick={exportRevenue}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Mês</th>
                  <th className="pb-2">Receita</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.map((m) => (
                  <tr key={m.month} className="border-b border-slate-50">
                    <td className="py-2">{MONTHS[m.month - 1]}</td>
                    <td className="font-medium text-slate-900">
                      {formatCurrency(m.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
