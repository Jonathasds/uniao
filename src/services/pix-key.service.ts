import { prisma } from "@/lib/prisma";
import { normalizePixKey } from "@/lib/pix-payload";
import { prismaSupportsPixKey } from "@/lib/prisma-pix-key";
import type { PixKeyType } from "@prisma/client";

export type PixKeyRow = {
  id: string;
  label: string;
  key: string;
  keyType: PixKeyType;
  isDefault: boolean;
  createdAt: Date;
};

const PIX_MODEL_ERROR =
  "Modelo PixKey indisponível. Execute `npx prisma generate` e reinicie o servidor (`npm run dev`).";

/**
 * Garante que o client Prisma possui o model PixKey.
 * @returns void
 */
function assertPixKeyModel() {
  if (!prismaSupportsPixKey() || !("pixKey" in prisma)) {
    throw new Error(PIX_MODEL_ERROR);
  }
}

/**
 * Lista todas as chaves PIX cadastradas.
 * @returns Chaves ordenadas (padrão primeiro, depois por nome).
 */
export async function getPixKeys(): Promise<PixKeyRow[]> {
  if (!prismaSupportsPixKey() || !("pixKey" in prisma)) {
    return [];
  }

  return prisma.pixKey.findMany({
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });
}

/**
 * Retorna a chave PIX padrão para exibição no comprovante.
 * @returns Chave padrão ou a primeira cadastrada.
 */
export async function getDefaultPixKeyForReceipt(): Promise<PixKeyRow | null> {
  if (!prismaSupportsPixKey() || !("pixKey" in prisma)) {
    return null;
  }

  const defaultKey = await prisma.pixKey.findFirst({
    where: { isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  if (defaultKey) return defaultKey;

  return prisma.pixKey.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Cadastra uma nova chave PIX.
 * @param data - Dados da chave.
 * @returns Chave criada.
 */
export async function createPixKey(data: {
  label: string;
  key: string;
  keyType: PixKeyType;
  isDefault?: boolean;
}) {
  assertPixKeyModel();

  const key = normalizePixKey(data.key, data.keyType);

  return prisma.$transaction(async (tx) => {
    const count = await tx.pixKey.count();

    if (data.isDefault || count === 0) {
      await tx.pixKey.updateMany({ data: { isDefault: false } });
    }

    return tx.pixKey.create({
      data: {
        label: data.label.trim(),
        key,
        keyType: data.keyType,
        isDefault: data.isDefault ?? count === 0,
      },
    });
  });
}

/**
 * Atualiza uma chave PIX existente.
 * @param id - ID da chave.
 * @param data - Campos a atualizar.
 * @returns Chave atualizada.
 */
export async function updatePixKey(
  id: string,
  data: {
    label: string;
    key: string;
    keyType: PixKeyType;
    isDefault?: boolean;
  }
) {
  assertPixKeyModel();

  const key = normalizePixKey(data.key, data.keyType);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.pixKey.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await tx.pixKey.update({
      where: { id },
      data: {
        label: data.label.trim(),
        key,
        keyType: data.keyType,
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      },
    });

    if (!updated.isDefault) {
      const defaultCount = await tx.pixKey.count({ where: { isDefault: true } });
      if (defaultCount === 0) {
        await tx.pixKey.update({
          where: { id },
          data: { isDefault: true },
        });
        return { ...updated, isDefault: true };
      }
    }

    return updated;
  });
}

/**
 * Remove uma chave PIX.
 * @param id - ID da chave.
 * @returns void
 */
export async function deletePixKey(id: string) {
  assertPixKeyModel();

  const removed = await prisma.pixKey.delete({ where: { id } });

  if (removed.isDefault) {
    const next = await prisma.pixKey.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (next) {
      await prisma.pixKey.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
}
