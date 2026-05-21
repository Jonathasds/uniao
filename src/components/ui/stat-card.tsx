"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  href?: string;
  className?: string;
};

/**
 * Card de métrica do dashboard, opcionalmente clicável.
 * @param props - Título, valor, ícone e link de destino.
 * @returns Card estático ou link para outra página.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  className,
}: StatCardProps) {
  const card = (
    <div
      className={cn(
        "flex h-full min-h-[152px] flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm",
        href &&
          "transition-all hover:border-primary/30 hover:bg-slate-50/80 hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold leading-tight text-slate-900">
            {value}
          </p>
          <div className="mt-auto min-h-[2.5rem] pt-2">
            {subtitle ? (
              <p className="text-xs text-slate-400">{subtitle}</p>
            ) : trend ? (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-600" : "text-red-500"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            ) : (
              <span className="sr-only">Sem detalhes adicionais</span>
            )}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );

  if (!href) {
    return <div className="h-full">{card}</div>;
  }

  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
