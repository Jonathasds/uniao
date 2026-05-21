import { createAdminSupabaseClient } from "@/utils/supabase/admin";
import { getServiceRoleKeyHelpMessage } from "@/utils/supabase/service-role-key";
import { getStorageBucket } from "@/utils/supabase/storage";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Valida tipo e tamanho da imagem enviada.
 * @param file - Arquivo do formulário.
 * @returns void
 */
function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG, WebP ou GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Imagem muito grande. O tamanho máximo é 2 MB.");
  }
}

/**
 * Retorna extensão de arquivo a partir do MIME type.
 * @param mimeType - Tipo MIME da imagem.
 * @returns Extensão sem ponto (jpg, png, webp, gif).
 */
function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/**
 * Envia imagem ao Supabase Storage e retorna URL pública.
 * @param folder - Pasta lógica (`company` ou `users`).
 * @param fileName - Nome do arquivo no bucket.
 * @param file - Arquivo de imagem.
 * @returns URL pública HTTPS do objeto.
 */
async function uploadImageToSupabase(
  folder: "company" | "users",
  fileName: string,
  file: File
): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const bucket = getStorageBucket();
  const objectPath = `${folder}/${fileName}`;
  const body = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("compact jws") || msg.includes("invalid jwt")) {
      throw new Error(getServiceRoleKeyHelpMessage());
    }
    const hint =
      msg.includes("bucket") || msg.includes("not found")
        ? ` Crie o bucket público "${bucket}" no painel Supabase ou execute: npm run supabase:storage:setup`
        : "";
    throw new Error(`Falha ao enviar imagem ao Supabase Storage.${hint} (${error.message})`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Salva o logo da empresa no Supabase Storage.
 * @param file - Arquivo de imagem enviado pelo formulário.
 * @returns URL pública da imagem.
 */
export async function saveCompanyLogo(file: File): Promise<string> {
  validateImageFile(file);
  const extension = extensionFromMimeType(file.type);
  const fileName = `logo-${Date.now()}.${extension}`;
  return uploadImageToSupabase("company", fileName, file);
}

/**
 * Salva a foto de perfil do usuário no Supabase Storage.
 * @param file - Arquivo de imagem enviado pelo formulário.
 * @param userId - ID do usuário autenticado.
 * @returns URL pública da imagem de perfil.
 */
export async function saveUserAvatar(file: File, userId: string): Promise<string> {
  validateImageFile(file);
  const extension = extensionFromMimeType(file.type);
  const fileName = `avatar-${userId}-${Date.now()}.${extension}`;
  return uploadImageToSupabase("users", fileName, file);
}
