const CHART_YEAR_MIN = 2000;

/**
 * Normaliza o ano do gráfico (padrão: ano corrente; não permite futuro).
 * @param input - Ano vindo da query string ou número.
 * @returns Ano entre 2000 e o ano atual.
 */
export function resolveChartYear(input?: string | number | null): number {
  const currentYear = new Date().getFullYear();
  const parsed =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number.parseInt(input, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return currentYear;
  }

  return Math.min(Math.max(parsed, CHART_YEAR_MIN), currentYear);
}

/**
 * Normaliza o mês do gráfico (1–12; padrão: mês corrente).
 * @param input - Mês vindo da query string ou número.
 * @returns Mês entre 1 e 12.
 */
export function resolveChartMonth(input?: string | number | null): number {
  const currentMonth = new Date().getMonth() + 1;
  const parsed =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number.parseInt(input, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return currentMonth;
  }

  return Math.min(Math.max(parsed, 1), 12);
}

/** Opções de mês para o seletor do gráfico (valor 1–12). */
export const CHART_MONTH_OPTIONS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
] as const;
