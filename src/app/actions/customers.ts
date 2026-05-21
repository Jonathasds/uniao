"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getRoleError } from "@/lib/auth-helpers";
import { SALES_ROLES } from "@/lib/permissions";
import { customerSchema } from "@/lib/validations/customer";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customer.service";

export async function createCustomerAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  const raw = Object.fromEntries(formData);
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await createCustomer(parsed.data);
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar cliente";
    if (message.includes("Unique constraint") || message.includes("document")) {
      return { error: "CPF/CNPJ já cadastrado." };
    }
    return {
      error:
        process.env.NODE_ENV === "development"
          ? message
          : "Erro ao criar cliente. Verifique o CPF/CNPJ.",
    };
  }
}

export async function updateCustomerAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos" };

  try {
    await updateCustomer(id, parsed.data);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar cliente" };
  }
}

export async function deleteCustomerAction(id: string) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };
  const roleError = getRoleError(session.user?.role, SALES_ROLES);
  if (roleError) return { error: roleError };

  try {
    await deleteCustomer(id);
    revalidatePath("/clientes");
    return { success: true };
  } catch {
    return { error: "Erro ao excluir cliente" };
  }
}
