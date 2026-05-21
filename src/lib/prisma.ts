import { createPrismaClient } from "@/lib/create-prisma-client";
import { withDatabaseRetry } from "@/lib/db-retry";
import type { PrismaClient } from "@prisma/client";

const DOLLAR_METHODS = new Set([
  "$connect",
  "$disconnect",
  "$on",
  "$transaction",
  "$extends",
  "$queryRaw",
  "$queryRawUnsafe",
  "$executeRaw",
  "$executeRawUnsafe",
]);

/**
 * Executa método Prisma com retry automático de conexão.
 * @param run - Callback com client ativo.
 * @returns Resultado da operação.
 */
function runPrisma<T>(run: (client: PrismaClient) => Promise<T>): Promise<T> {
  return withDatabaseRetry(() => run(createPrismaClient()));
}

/**
 * Proxy de um modelo Prisma (`prisma.sale`, `prisma.quote`, …).
 * @param modelName - Nome do delegate no client.
 * @returns Objeto com métodos com retry de conexão.
 */
function createModelProxy(modelName: keyof PrismaClient): object {
  return new Proxy(
    {},
    {
      get(_target, method) {
        if (method === "then" || typeof method === "symbol") {
          return undefined;
        }

        return (...args: unknown[]) =>
          runPrisma((client) => {
            const model = client[modelName];

            if (!model || typeof model !== "object") {
              throw new Error(`Modelo Prisma inválido: ${String(modelName)}`);
            }

            const fn = Reflect.get(model, method);

            if (typeof fn !== "function") {
              throw new Error(
                `Método Prisma inválido: ${String(modelName)}.${String(method)}`
              );
            }

            return Reflect.apply(fn, model, args) as Promise<unknown>;
          });
      },
    }
  );
}

/**
 * Cliente Prisma com retry automático em todas as operações.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (property === "then" || typeof property === "symbol") {
      return undefined;
    }

    const key = String(property);

    if (DOLLAR_METHODS.has(key)) {
      return (...args: unknown[]) =>
        runPrisma((client) => {
          const fn = client[property as keyof PrismaClient];
          if (typeof fn !== "function") {
            throw new Error(`Método Prisma inválido: ${key}`);
          }
          return Reflect.apply(fn, client, args) as Promise<unknown>;
        });
    }

    const sample = createPrismaClient()[property as keyof PrismaClient];

    if (sample !== null && typeof sample === "object") {
      return createModelProxy(property as keyof PrismaClient);
    }

    return sample;
  },
});
