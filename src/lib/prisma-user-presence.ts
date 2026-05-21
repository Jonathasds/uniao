import { Prisma } from "@prisma/client";

/**
 * Verifica se o Prisma Client gerado inclui o campo `lastSeenAt` no modelo User.
 * Evita erro quando o dev server ainda usa um client em cache desatualizado.
 * @returns `true` se o campo existe no client atual.
 */
export function userModelSupportsLastSeenAt(): boolean {
  try {
    return (
      Prisma.dmmf.datamodel.models
        .find((model) => model.name === "User")
        ?.fields.some((field) => field.name === "lastSeenAt") ?? false
    );
  } catch {
    return false;
  }
}
