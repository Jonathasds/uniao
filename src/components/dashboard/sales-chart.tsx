"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  CHART_MONTH_OPTIONS,
  resolveChartMonth,
  resolveChartYear,
} from "@/lib/chart-year";
import { replaceChartUrl } from "@/lib/chart-url";
import { fetchMonthlySalesComparisonAction } from "@/app/actions/dashboard-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export type MonthlySalesComparison = {
  month: string;
  previousMonth: string;
  monthFull: string;
  total: number;
  previousTotal: number;
};

type SalesChartProps = {
  comparison: MonthlySalesComparison;
  year: number;
  month: number;
  previousYear: number;
  minYear: number;
  maxYear: number;
};

const CHART_BAR_HEIGHT = 200;

/**
 * Calcula o teto da escala com folga para as barras.
 * @param values - Valores a comparar.
 * @returns Máximo da escala ou 1 se vazio.
 */
function scaleMax(values: number[]): number {
  const max = Math.max(...values, 0);
  return Math.ceil((max || 1) * 1.12);
}

/**
 * Variação percentual entre dois valores.
 * @param current - Valor do ano/mês selecionado.
 * @param previous - Valor do mesmo mês no ano anterior.
 * @returns Percentual arredondado ou null se não houver base.
 */
function growthPercent(current: number, previous: number): number | null {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 100);
  }
  if (current > 0) return 100;
  return null;
}

/**
 * Gráfico de um único mês: ano selecionado vs mesmo mês do ano anterior.
 * @param props - Período, totais e limites do seletor de ano.
 * @returns Filtros e barras comparativas.
 */
export function SalesChart({
  comparison: initialComparison,
  year: initialYear,
  month: initialMonth,
  previousYear: initialPreviousYear,
  minYear,
  maxYear,
}: SalesChartProps) {
  const [isPending, startTransition] = useTransition();
  const [comparison, setComparison] =
    useState<MonthlySalesComparison>(initialComparison);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedPreviousYear, setSelectedPreviousYear] =
    useState(initialPreviousYear);
  const [yearInput, setYearInput] = useState(String(initialYear));
  const [monthValue, setMonthValue] = useState(String(initialMonth));

  const now = useMemo(() => new Date(), []);
  const isCurrentPeriod =
    selectedYear === now.getFullYear() &&
    selectedMonth === now.getMonth() + 1;

  useEffect(() => {
    setComparison(initialComparison);
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
    setSelectedPreviousYear(initialPreviousYear);
    setYearInput(String(initialYear));
    setMonthValue(String(initialMonth));
  }, [
    initialComparison,
    initialYear,
    initialMonth,
    initialPreviousYear,
  ]);

  const growth = growthPercent(comparison.total, comparison.previousTotal);
  const scaleTop = scaleMax([comparison.total, comparison.previousTotal]);
  const hasData = comparison.total > 0 || comparison.previousTotal > 0;

  const currentBarHeight =
    scaleTop > 0
      ? Math.max((comparison.total / scaleTop) * 100, comparison.total > 0 ? 4 : 0)
      : 0;
  const previousBarHeight =
    scaleTop > 0
      ? Math.max(
          (comparison.previousTotal / scaleTop) * 100,
          comparison.previousTotal > 0 ? 4 : 0
        )
      : 0;

  const loadPeriod = useCallback(
    (nextYear: number, nextMonth: number) => {
      if (nextYear === selectedYear && nextMonth === selectedMonth) {
        return;
      }

      replaceChartUrl(nextYear, nextMonth);
      setYearInput(String(nextYear));
      setMonthValue(String(nextMonth));

      startTransition(async () => {
        const result = await fetchMonthlySalesComparisonAction(
          nextYear,
          nextMonth
        );

        if ("error" in result) {
          return;
        }

        setComparison(result.monthlySalesComparison);
        setSelectedYear(result.chartYear);
        setSelectedMonth(result.chartMonth);
        setSelectedPreviousYear(result.chartPreviousYear);
      });
    },
    [selectedYear, selectedMonth]
  );

  const handleYearApply = useCallback(() => {
    const resolvedYear = resolveChartYear(yearInput);
    const resolvedMonth = resolveChartMonth(monthValue);
    if (resolvedYear !== selectedYear || resolvedMonth !== selectedMonth) {
      loadPeriod(resolvedYear, resolvedMonth);
    } else {
      setYearInput(String(selectedYear));
    }
  }, [loadPeriod, monthValue, selectedYear, selectedMonth, yearInput]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-28">
          <Label htmlFor="chart-year">Ano</Label>
          <Input
            id="chart-year"
            type="number"
            min={minYear}
            max={maxYear}
            value={yearInput}
            disabled={isPending}
            className="mt-1.5 bg-white"
            onChange={(e) => setYearInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleYearApply();
              }
            }}
            onBlur={handleYearApply}
          />
        </div>

        <div className="min-w-[180px] flex-1 sm:max-w-xs">
          <Label>Mês</Label>
          <Select
            className="mt-1.5 bg-white"
            value={monthValue}
            disabled={isPending}
            options={[...CHART_MONTH_OPTIONS]}
            onValueChange={(value) => {
              setMonthValue(value);
              loadPeriod(resolveChartYear(yearInput), resolveChartMonth(value));
            }}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 bg-white"
          disabled={isPending || isCurrentPeriod}
          onClick={() =>
            loadPeriod(now.getFullYear(), now.getMonth() + 1)
          }
        >
          Mês atual
        </Button>

        <div className="flex w-full flex-wrap gap-4 text-xs text-slate-500 sm:ml-auto sm:w-auto">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
            {selectedYear}
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-slate-400" />
            {selectedPreviousYear}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 px-3 py-2.5">
          <p className="text-xs font-medium text-blue-600 capitalize">
            {comparison.monthFull}
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-blue-900">
            {formatCurrency(comparison.total)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500 capitalize">
            Mesmo mês em {selectedPreviousYear}
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
            {formatCurrency(comparison.previousTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">Variação</p>
          <p
            className={`mt-0.5 text-base font-semibold tabular-nums ${
              growth === null
                ? "text-slate-500"
                : growth > 0
                  ? "text-emerald-700"
                  : growth < 0
                    ? "text-red-600"
                    : "text-slate-700"
            }`}
          >
            {growth === null ? "—" : `${growth > 0 ? "+" : ""}${growth}%`}
          </p>
        </div>
      </div>

      <div
        className={`rounded-xl border border-slate-200 bg-white p-6 transition-opacity ${
          isPending ? "opacity-60" : ""
        }`}
      >
        {hasData ? (
          <>
            <p className="mb-6 text-center text-sm font-medium capitalize text-slate-700">
              {comparison.monthFull} vs{" "}
              {CHART_MONTH_OPTIONS[selectedMonth - 1]?.label.toLowerCase()} de{" "}
              {selectedPreviousYear}
            </p>

            <div className="mx-auto flex max-w-md items-end justify-center gap-10 sm:gap-16">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-blue-700">
                  {formatCurrency(comparison.total)}
                </span>
                <div
                  className="flex w-20 items-end justify-center sm:w-24"
                  style={{ height: CHART_BAR_HEIGHT }}
                >
                  <div
                    className="w-full max-w-[4.5rem] rounded-t-lg bg-blue-600 transition-all duration-300"
                    style={{ height: `${currentBarHeight}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {selectedYear}
                </span>
                <span className="text-[11px] text-slate-400">
                  {comparison.month}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-slate-600">
                  {formatCurrency(comparison.previousTotal)}
                </span>
                <div
                  className="flex w-20 items-end justify-center sm:w-24"
                  style={{ height: CHART_BAR_HEIGHT }}
                >
                  <div
                    className="w-full max-w-[4.5rem] rounded-t-lg bg-slate-400 transition-all duration-300"
                    style={{ height: `${previousBarHeight}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {selectedPreviousYear}
                </span>
                <span className="text-[11px] text-slate-400">
                  {comparison.previousMonth}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center text-sm text-slate-500"
            style={{ height: CHART_BAR_HEIGHT }}
          >
            Nenhuma venda concluída neste período
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Comparativo do mês selecionado com o mesmo mês do ano anterior
        </p>
      </div>
    </div>
  );
}
