import { Prisma } from "@prisma/client";

/**
 * Verifica se o Prisma Client gerado inclui o modelo `PixKey`.
 * @returns `true` quando o model existe no client atual.
 */
export function prismaSupportsPixKey(): boolean {
  try {
    return Prisma.dmmf.datamodel.models.some((model) => model.name === "PixKey");
  } catch {
    return false;
  }
}
