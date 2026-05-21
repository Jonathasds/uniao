import { z } from "zod";

const glassColorEnum = z.enum(["INCOLOR", "VERDE", "FUME", "REFLETIVO"]);
const glassThicknessEnum = z.enum(["MM_6", "MM_8", "MM_10"]);

export const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sku: z.string().min(1, "SKU é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição do produto é obrigatória"),
  glassColor: glassColorEnum,
  glassThickness: glassThicknessEnum,
  heightMm: z.coerce.number().int().min(1, "Altura deve ser maior que zero"),
  widthMm: z.coerce.number().int().min(1, "Largura deve ser maior que zero"),
  salePrice: z.coerce.number().min(0, "Preço de venda inválido"),
  stock: z.coerce.number().int().min(0, "Estoque inválido"),
  barcode: z.string().optional(),
  image: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
