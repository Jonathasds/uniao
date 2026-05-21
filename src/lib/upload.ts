import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Salva o arquivo de logo da empresa em `public/uploads/company`.
 * @param file - Arquivo de imagem enviado pelo formulário.
 * @returns Caminho público da imagem (ex.: `/uploads/company/logo-123.png`).
 */
export async function saveCompanyLogo(file: File): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG, WebP ou GIF.");
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("Imagem muito grande. O tamanho máximo é 2 MB.");
  }

  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "gif";

  const fileName = `logo-${Date.now()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "company");
  const filePath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/company/${fileName}`;
}

/**
 * Salva a foto de perfil do usuário em `public/uploads/users`.
 * @param file - Arquivo de imagem enviado pelo formulário.
 * @param userId - ID do usuário autenticado.
 * @returns Caminho público da imagem de perfil.
 */
export async function saveUserAvatar(file: File, userId: string): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPG, WebP ou GIF.");
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("Imagem muito grande. O tamanho máximo é 2 MB.");
  }

  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "gif";

  const fileName = `avatar-${userId}-${Date.now()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "users");
  const filePath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/users/${fileName}`;
}
