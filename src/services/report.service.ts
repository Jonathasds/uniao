import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

/**
 * Relatório de vendas por período.
 */
export async function getSalesReport(startDate: Date, endDate: Date) {
  return prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Produtos mais vendidos.
 */
export async function getTopProducts(limit = 10) {
  const items = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { category: true },
  });

  return items.map((item) => ({
    product: products.find((p) => p.id === item.productId)!,
    quantity: item._sum.quantity ?? 0,
  }));
}

/**
 * Clientes que mais compram.
 */
export async function getTopCustomers(limit = 10) {
  const sales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { status: "COMPLETED" },
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: sales.map((s) => s.customerId) } },
  });

  return sales.map((s) => ({
    customer: customers.find((c) => c.id === s.customerId)!,
    total: toNumber(s._sum.total ?? 0),
    count: s._count,
  }));
}

/**
 * Receita mensal de vendas concluídas.
 * @param year - Ano de referência
 * @returns Receita por mês
 */
export async function getMonthlyRevenue(year: number) {
  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
    },
    select: { total: true, createdAt: true },
  });

  const monthly: Record<number, number> = {};

  for (let m = 0; m < 12; m++) {
    monthly[m] = 0;
  }

  for (const sale of sales) {
    const month = new Date(sale.createdAt).getMonth();
    monthly[month] += toNumber(sale.total);
  }

  return Object.entries(monthly).map(([month, revenue]) => ({
    month: Number(month) + 1,
    revenue,
  }));
}
