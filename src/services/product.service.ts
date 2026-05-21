import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { toNumber } from "@/lib/utils";
import type { ProductFormData } from "@/lib/validations/product";
import { Prisma } from "@prisma/client";

type ProductWithSalePrice = {
  salePrice: Parameters<typeof toNumber>[0];
};

/**
 * Converte preço Decimal do Prisma em número serializável para Client Components.
 * @param product - Produto retornado pelo Prisma
 * @returns Produto com preço de venda como number
 */
export function serializeProduct<T extends ProductWithSalePrice>(product: T) {
  return {
    ...product,
    salePrice: toNumber(product.salePrice),
  };
}

/**
 * Lista produtos com paginação e filtros.
 */
export async function getProducts(params: {
  page?: number;
  search?: string;
  categoryId?: string;
}) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
        { barcode: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: data.map(serializeProduct),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca produto por ID.
 */
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  return product ? serializeProduct(product) : null;
}

/**
 * Cria um novo produto.
 */
export async function createProduct(data: ProductFormData) {
  const product = await prisma.product.create({
    data,
    include: { category: true },
  });

  return serializeProduct(product);
}

/**
 * Atualiza produto existente.
 */
export async function updateProduct(id: string, data: ProductFormData) {
  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });

  return serializeProduct(product);
}

/**
 * Remove produto (soft delete).
 */
export async function deleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { active: false },
  });
}

/**
 * Lista todas as categorias.
 */
export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

/** Lista todos os produtos ativos (para selects). */
export async function getAllProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return products.map(serializeProduct);
}
