"use server";

import { auth } from "@/lib/auth";
import { resolveChartMonth, resolveChartYear } from "@/lib/chart-year";
import { getMonthlySalesComparison } from "@/services/dashboard.service";

/**
 * Carrega o comparativo do gráfico sem recarregar a página do dashboard.
 * @param year - Ano solicitado.
 * @param month - Mês solicitado (1–12).
 * @returns Dados do período ou mensagem de erro.
 */
export async function fetchMonthlySalesComparisonAction(
  year: number,
  month: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autorizado" };
  }

  const chartYear = resolveChartYear(year);
  const chartMonth = resolveChartMonth(month);

  try {
    const monthlySalesComparison = await getMonthlySalesComparison(
      chartYear,
      chartMonth
    );

    return {
      chartYear,
      chartMonth,
      chartPreviousYear: chartYear - 1,
      monthlySalesComparison,
    };
  } catch {
    return { error: "Erro ao carregar comparativo" };
  }
}
