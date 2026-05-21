import { prisma } from "@/lib/prisma";
import type { CategoryFormData } from "@/lib/validations/category";
import type { Prisma } from "@prisma/client";

const ARCHIVE_CATEGORY_NAME = "Arquivado";

/**
 * Lista categorias de produtos com quantidade vinculada.
 * @returns Categorias ordenadas por nome.
 */
export async function getCategoriesWithProductCount() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

/**
 * Cria uma nova categoria de produto.
 * @param data - Nome da categoria.
 * @returns Categoria criada.
 */
export async function createCategory(data: CategoryFormData) {
  return prisma.category.create({
    data: { name: data.name.trim() },
  });
}

/**
 * Garante a categoria interna usada para produtos de categorias removidas.
 * @param tx - Cliente Prisma da transação.
 * @param excludeCategoryId - ID da categoria que está sendo excluída.
 * @returns ID da categoria de arquivamento.
 */
async function ensureArchiveCategory(
  tx: Prisma.TransactionClient,
  excludeCategoryId: string
) {
  const archive = await tx.category.upsert({
    where: { name: ARCHIVE_CATEGORY_NAME },
    create: { name: ARCHIVE_CATEGORY_NAME },
    update: {},
  });

  if (archive.id === excludeCategoryId) {
    throw new Error(
      "Exclua os produtos da categoria Arquivado antes de removê-la"
    );
  }

  return archive.id;
}

/**
 * Remove uma categoria e trata os produtos vinculados.
 * Produtos sem histórico são excluídos; os demais são inativados em "Arquivado".
 * @param id - ID da categoria.
 * @returns void
 */
export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Categoria não encontrada");
  }

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { categoryId: id },
      select: { id: true },
    });

    let archiveCategoryId: string | null = null;

    for (const product of products) {
      const [sales, quotes] = await Promise.all([
        tx.saleItem.count({ where: { productId: product.id } }),
        tx.quoteItem.count({ where: { productId: product.id } }),
      ]);

      if (sales === 0 && quotes === 0) {
        await tx.stockMovement.deleteMany({ where: { productId: product.id } });
        await tx.product.delete({ where: { id: product.id } });
        continue;
      }

      if (!archiveCategoryId) {
        archiveCategoryId = await ensureArchiveCategory(tx, id);
      }

      await tx.product.update({
        where: { id: product.id },
        data: { categoryId: archiveCategoryId, active: false },
      });
    }

    await tx.category.delete({ where: { id } });
  });
}
