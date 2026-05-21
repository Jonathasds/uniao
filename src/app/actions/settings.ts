"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  canEditCompany,
  canManageUsers,
} from "@/lib/permissions";
import { saveCompanyLogo } from "@/lib/upload";
import {
  updateCompanySettings,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/settings.service";

export async function updateCompanyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !canEditCompany(session.user.role)) {
    return { error: "Sem permissão" };
  }

  try {
    const logoFile = formData.get("logoFile");
    let logo = ((formData.get("logo") as string) || "").trim() || undefined;
    let warning: string | undefined;

    if (logoFile instanceof File && logoFile.size > 0) {
      try {
        logo = await saveCompanyLogo(logoFile);
      } catch (uploadError) {
        warning =
          uploadError instanceof Error
            ? uploadError.message
            : "Não foi possível salvar a logo.";
      }
    }

    await updateCompanySettings({
      name: formData.get("name") as string,
      document: (formData.get("document") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      logo,
    });
    revalidatePath("/configuracoes");
    revalidatePath("/", "layout");
    return { success: true, warning };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao salvar configurações",
    };
  }
}

export async function createUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !canManageUsers(session.user.role)) {
    return { error: "Sem permissão. Apenas administrador pode gerenciar usuários." };
  }

  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Senha inválida" };
  }

  try {
    await createUser({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password,
      role: formData.get("role") as
        | "ADMIN"
        | "MANAGER"
        | "SELLER"
        | "EMPLOYEE",
    });
    revalidatePath("/configuracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao criar usuário" };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !canManageUsers(session.user.role)) {
    return { error: "Sem permissão. Apenas administrador pode gerenciar usuários." };
  }

  const password = (formData.get("password") as string)?.trim();

  if (password && password.length < 6) {
    return { error: "Senha deve ter pelo menos 6 caracteres" };
  }

  try {
    await updateUser(id, {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as
        | "ADMIN"
        | "MANAGER"
        | "SELLER"
        | "EMPLOYEE",
      active: formData.get("active") === "true",
      ...(password && { password }),
    });
    revalidatePath("/configuracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar usuário" };
  }
}

/**
 * Exclui ou desativa um usuário (somente administrador).
 * @param id - ID do usuário.
 * @returns Resultado da operação.
 */
export async function deleteUserAction(id: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role || !canManageUsers(session.user.role)) {
    return { error: "Sem permissão. Apenas administrador pode gerenciar usuários." };
  }

  try {
    const result = await deleteUser(id, session.user.id);
    revalidatePath("/configuracoes");
    return {
      success: true,
      deactivated: result.deactivated,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao excluir usuário",
    };
  }
}
