"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canEditCompany } from "@/lib/permissions";
import { pixKeySchema } from "@/lib/validations/pix-key";
import {
  createPixKey,
  deletePixKey,
  updatePixKey,
} from "@/services/pix-key.service";
/**
 * Cria uma chave PIX (admin ou gerente).
 * @param formData - Dados do formulário.
 * @returns Resultado da operação.
 */
export async function createPixKeyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !canEditCompany(session.user.role)) {
    return { error: "Sem permissão para gerenciar chaves PIX." };
  }

  const parsed = pixKeySchema.safeParse({
    label: formData.get("label"),
    key: formData.get("key"),
    keyType: formData.get("keyType"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message =
      errors.label?.[0] ??
      errors.key?.[0] ??
      errors.keyType?.[0] ??
      "Dados inválidos";
    return { error: message };
  }

  try {
    await createPixKey(parsed.data);
    revalidatePath("/configuracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao cadastrar chave PIX." };
  }
}

/**
 * Atualiza uma chave PIX existente.
 * @param id - ID da chave.
 * @param formData - Dados do formulário.
 * @returns Resultado da operação.
 */
export async function updatePixKeyAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !canEditCompany(session.user.role)) {
    return { error: "Sem permissão para gerenciar chaves PIX." };
  }

  const parsed = pixKeySchema.safeParse({
    label: formData.get("label"),
    key: formData.get("key"),
    keyType: formData.get("keyType"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message =
      errors.label?.[0] ??
      errors.key?.[0] ??
      errors.keyType?.[0] ??
      "Dados inválidos";
    return { error: message };
  }

  try {
    await updatePixKey(id, parsed.data);
    revalidatePath("/configuracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar chave PIX." };
  }
}

/**
 * Exclui uma chave PIX.
 * @param id - ID da chave.
 * @returns Resultado da operação.
 */
export async function deletePixKeyAction(id: string) {
  const session = await auth();
  if (!session?.user?.role || !canEditCompany(session.user.role)) {
    return { error: "Sem permissão para gerenciar chaves PIX." };
  }

  try {
    await deletePixKey(id);
    revalidatePath("/configuracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao excluir chave PIX." };
  }
}
