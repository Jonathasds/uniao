"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canManageCategories } from "@/lib/permissions";
import { categorySchema } from "@/lib/validations/category";
import {
  createCategory,
  deleteCategory,
} from "@/services/category.service";

/**
 * Cria uma categoria de produto (somente administrador).
 * @param name - Nome da nova categoria.
 * @returns Resultado da operação.
 */
export async function createCategoryAction(name: string) {
  const session = await auth();
  if (!session?.user?.role || !canManageCategories(session.user.role)) {
    return {
      error: "Sem permissão. Apenas administrador pode gerenciar categorias.",
    };
  }

  const parsed = categorySchema.safeParse({ name });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Dados inválidos" };
  }

  try {
    await createCategory(parsed.data);
    revalidatePath("/configuracoes");
    revalidatePath("/produtos");
    return { success: true };
  } catch {
    return { error: "Erro ao criar categoria. O nome pode já existir." };
  }
}

/**
 * Remove uma categoria de produto (somente administrador).
 * @param id - ID da categoria.
 * @returns Resultado da operação.
 */
export async function deleteCategoryAction(id: string) {
  const session = await auth();
  if (!session?.user?.role || !canManageCategories(session.user.role)) {
    return {
      error: "Sem permissão. Apenas administrador pode gerenciar categorias.",
    };
  }

  try {
    await deleteCategory(id);
    revalidatePath("/configuracoes");
    revalidatePath("/produtos");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao remover categoria",
    };
  }
}
