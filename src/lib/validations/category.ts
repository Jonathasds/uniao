import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome da categoria deve ter pelo menos 2 caracteres"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
