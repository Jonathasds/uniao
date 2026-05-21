/**
 * Monta a URL do dashboard com filtros do gráfico (omitindo valores padrão).
 * @param year - Ano selecionado.
 * @param month - Mês selecionado (1–12).
 * @param referenceDate - Data de referência para o período padrão.
 * @returns Caminho com query string ou `/`.
 */
export function buildChartPath(
  year: number,
  month: number,
  referenceDate: Date = new Date()
): string {
  const params = new URLSearchParams();
  const defaultYear = referenceDate.getFullYear();
  const defaultMonth = referenceDate.getMonth() + 1;

  if (year !== defaultYear) {
    params.set("year", String(year));
  }
  if (month !== defaultMonth) {
    params.set("month", String(month));
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/**
 * Atualiza a barra de endereço sem navegar nem rolar a página.
 * @param year - Ano selecionado.
 * @param month - Mês selecionado (1–12).
 */
export function replaceChartUrl(year: number, month: number): void {
  if (typeof window === "undefined") return;
  const path = buildChartPath(year, month);
  window.history.replaceState(window.history.state, "", path);
}
