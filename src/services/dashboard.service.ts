import { resolveChartMonth, resolveChartYear } from "@/lib/chart-year";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { serializeProduct } from "@/services/product.service";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Busca estatísticas do dashboard administrativo.
 * @param chartYear - Ano do mês exibido no gráfico (padrão: ano atual).
 * @param chartMonth - Mês exibido no gráfico, 1–12 (padrão: mês atual).
 * @returns Dados agregados para o dashboard.
 */
export async function getDashboardStats(chartYear?: number, chartMonth?: number) {
  const year = resolveChartYear(chartYear);
  const month = resolveChartMonth(chartMonth);
  return getDashboardStatsQuery(year, month);
}

/**
 * Consulta agregada do dashboard (executada com retry de conexão).
 * @param chartYear - Ano civil selecionado no gráfico.
 * @param chartMonth - Mês selecionado (1–12).
 * @returns Dados agregados para o dashboard.
 */
async function getDashboardStatsQuery(chartYear: number, chartMonth: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousChartYear = chartYear - 1;
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const monthlySalesAgg = await prisma.sale.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    _sum: { total: true },
  });

  const previousMonthSalesAgg = await prisma.sale.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
    },
    _sum: { total: true },
  });

  const openOrders = await prisma.sale.count({ where: { status: "PENDING" } });
  const openServiceOrders = await prisma.serviceOrder.count({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
  });
  const pendingQuotes = await prisma.quote.count({
    where: { status: "PENDING" },
  });
  const totalCustomers = await prisma.customer.count();

  const recentSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: { include: { product: true } },
    },
  });

  const firstCompletedSale = await prisma.sale.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const chartMinYear = firstCompletedSale
    ? new Date(firstCompletedSale.createdAt).getFullYear()
    : currentYear;

  const monthlySalesComparison = await getMonthlySalesComparisonQuery(
    chartYear,
    chartMonth
  );

  const monthlySales = toNumber(monthlySalesAgg._sum.total ?? 0);
  const previousMonthSales = toNumber(previousMonthSalesAgg._sum.total ?? 0);

  const salesGrowth =
    previousMonthSales > 0
      ? Math.round(
          ((monthlySales - previousMonthSales) / previousMonthSales) * 100
        )
      : monthlySales > 0
        ? 100
        : 0;

  return {
    monthlySales,
    previousMonthSales,
    salesGrowth,
    openOrders,
    pendingQuotes,
    openServiceOrders,
    totalCustomers,
    chartYear,
    chartMonth,
    chartPreviousYear: previousChartYear,
    chartMinYear,
    chartMaxYear: currentYear,
    monthlySalesComparison,
    recentSales: recentSales.map((sale) => ({
      ...sale,
      subtotal: toNumber(sale.subtotal),
      discount: toNumber(sale.discount),
      downPayment: toNumber(sale.downPayment),
      total: toNumber(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: toNumber(item.unitPrice),
        total: toNumber(item.total),
        product: serializeProduct(item.product),
      })),
    })),
  };
}

/**
 * Busca o comparativo de vendas de um mês vs o mesmo mês do ano anterior.
 * @param chartYear - Ano civil selecionado.
 * @param chartMonth - Mês selecionado (1–12).
 * @returns Totais e rótulos do período.
 */
export async function getMonthlySalesComparison(
  chartYear: number,
  chartMonth: number
) {
  return getMonthlySalesComparisonQuery(chartYear, chartMonth);
}

/**
 * Consulta o comparativo mensal (executada com retry de conexão).
 * @param chartYear - Ano civil selecionado.
 * @param chartMonth - Mês selecionado (1–12).
 * @returns Totais e rótulos do período.
 */
async function getMonthlySalesComparisonQuery(
  chartYear: number,
  chartMonth: number
) {
  const previousChartYear = chartYear - 1;
  const selectedMonthDate = new Date(chartYear, chartMonth - 1, 1);
  const previousMonthDate = new Date(previousChartYear, chartMonth - 1, 1);

  const currentMonthSalesAgg = await prisma.sale.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: startOfMonth(selectedMonthDate),
        lte: endOfMonth(selectedMonthDate),
      },
    },
    _sum: { total: true },
  });

  const previousYearMonthSalesAgg = await prisma.sale.aggregate({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: startOfMonth(previousMonthDate),
        lte: endOfMonth(previousMonthDate),
      },
    },
    _sum: { total: true },
  });

  const total = toNumber(currentMonthSalesAgg._sum.total ?? 0);
  const previousTotal = toNumber(previousYearMonthSalesAgg._sum.total ?? 0);

  const formatMonthShort = (date: Date) =>
    format(date, "MMM/yy", { locale: ptBR })
      .replace(/\./g, "")
      .replace(/^\w/, (char) => char.toUpperCase());

  return {
    month: formatMonthShort(selectedMonthDate),
    previousMonth: formatMonthShort(previousMonthDate),
    monthFull: format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR }),
    total,
    previousTotal,
  };
}
