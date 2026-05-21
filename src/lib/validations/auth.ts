import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ADMIN", "MANAGER", "SELLER", "EMPLOYEE"]),
  active: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;
