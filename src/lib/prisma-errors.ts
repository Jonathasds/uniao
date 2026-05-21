import { Prisma } from "@prisma/client";

/**
 * Indica se o erro Prisma é "registro não encontrado" (sessão com ID obsoleto).
 * @param error - Erro capturado.
 * @returns true para códigos P2025 / P2018.
 */
export function isPrismaRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2025" || error.code === "P2018")
  );
}
