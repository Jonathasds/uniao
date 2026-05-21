"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getRoleError } from "@/lib/auth-helpers";
import { ADMIN_ROLES } from "@/lib/permissions";
import { productSchema } from "@/lib/validations/product";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/product.service";

export async function createProductAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, ADMIN_ROLES);
  if (roleError) return { error: roleError };

  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({
    ...raw,
    heightMm: raw.heightMm,
    widthMm: raw.widthMm,
    salePrice: raw.salePrice,
    stock: raw.stock,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await createProduct(parsed.data);
    revalidatePath("/produtos");
    return { success: true };
  } catch {
    return { error: "Erro ao criar produto" };
  }
}

export async function updateProductAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, ADMIN_ROLES);
  if (roleError) return { error: roleError };

  const raw = Object.fromEntries(formData);
  const parsed = productSchema.safeParse({
    ...raw,
    heightMm: raw.heightMm,
    widthMm: raw.widthMm,
    salePrice: raw.salePrice,
    stock: raw.stock,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await updateProduct(id, parsed.data);
    revalidatePath("/produtos");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar produto" };
  }
}

export async function deleteProductAction(id: string) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, ADMIN_ROLES);
  if (roleError) return { error: roleError };

  try {
    await deleteProduct(id);
    revalidatePath("/produtos");
    return { success: true };
  } catch {
    return { error: "Erro ao excluir produto" };
  }
}
