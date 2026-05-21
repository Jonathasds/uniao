"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { saveUserAvatar } from "@/lib/upload";
import { updateUserImage } from "@/services/settings.service";

/**
 * Salva a foto de perfil do usuário autenticado.
 * @param formData - Formulário com o campo `avatar` (arquivo de imagem).
 * @returns Resultado da operação com o caminho da imagem ou erro.
 */
export async function updateUserAvatarAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autorizado" };
  }

  const avatarFile = formData.get("avatar");
  if (
    !avatarFile ||
    typeof avatarFile === "string" ||
    !("arrayBuffer" in avatarFile) ||
    avatarFile.size === 0
  ) {
    return { error: "Selecione uma imagem" };
  }

  try {
    const image = await saveUserAvatar(avatarFile as File, session.user.id);
    await updateUserImage(session.user.id, image);
    revalidatePath("/", "layout");
    return { success: true, image };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar foto de perfil",
    };
  }
}
