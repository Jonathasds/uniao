import { z } from "zod";

export const pixKeySchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres"),
  key: z
    .string()
    .trim()
    .min(3, "Informe a chave PIX"),
  keyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
  isDefault: z.boolean().optional(),
});

export type PixKeyFormData = z.infer<typeof pixKeySchema>;
