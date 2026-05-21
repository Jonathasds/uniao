/** Bucket público para logos e avatares. */
export const DEFAULT_STORAGE_BUCKET = "uploads";

/**
 * Nome do bucket Supabase Storage usado pela aplicação.
 * @returns Identificador do bucket (padrão: uploads).
 */
export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}
