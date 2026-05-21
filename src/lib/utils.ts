import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes Tailwind sem conflitos.
 * @param inputs - Classes CSS a mesclar
 * @returns String de classes mescladas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor numérico como moeda BRL.
 * @param value - Valor numérico ou string
 * @returns Valor formatado em reais
 */
export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num || 0);
}

/**
 * Formata data para exibição em pt-BR.
 * @param date - Data a formatar
 * @returns Data formatada
 */
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Formata data e hora para exibição em pt-BR.
 * @param date - Data a formatar
 * @returns Data e hora formatadas
 */
export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Gera código sequencial com prefixo.
 * @param prefix - Prefixo do código (ex: VND, ORC)
 * @param sequence - Número sequencial
 * @returns Código formatado
 */
export function generateCode(prefix: string, sequence: number) {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Converte Decimal do Prisma para number.
 * @param value - Valor decimal
 * @returns Número
 */
/**
 * Formata medidas de vidro (altura × largura em milímetros).
 * @param heightMm - Altura em mm
 * @param widthMm - Largura em mm
 * @returns Texto formatado ou traço se incompleto
 */
export function formatGlassDimensions(
  heightMm: number | null | undefined,
  widthMm: number | null | undefined
) {
  if (!heightMm || !widthMm) return "—";
  return `${heightMm} × ${widthMm} mm`;
}

export function toNumber(value: { toNumber?: () => number } | number | string) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber?.() ?? Number(value);
  }
  return Number(value) || 0;
}
