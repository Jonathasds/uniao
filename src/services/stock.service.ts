import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { serializeProduct } from "@/services/product.service";
import type { StockMovementType } from "@prisma/client";

export async function getStockMovements(params: { page?: number }) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      include: {
        product: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count(),
  ]);

  return {
    data: data.map((movement) => ({
      ...movement,
      product: serializeProduct(movement.product),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Registra movimentação de estoque.
 */
export async function createStockMovement(params: {
  productId: string;
  userId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) throw new Error("Produto não encontrado");

    if (params.type === "OUT" && product.stock < params.quantity) {
      throw new Error("Estoque insuficiente");
    }

    const stockUpdate =
      params.type === "IN"
        ? { increment: params.quantity }
        : params.type === "OUT"
          ? { decrement: params.quantity }
          : undefined;

    if (params.type === "ADJUSTMENT") {
      await tx.product.update({
        where: { id: params.productId },
        data: { stock: params.quantity },
      });
    } else if (stockUpdate) {
      await tx.product.update({
        where: { id: params.productId },
        data: { stock: stockUpdate },
      });
    }

    const movement = await tx.stockMovement.create({
      data: params,
      include: { product: true, user: { select: { id: true, name: true } } },
    });

    return {
      ...movement,
      product: serializeProduct(movement.product),
    };
  });
}

export async function getLowStockProducts() {
  const settings = await prisma.companySettings.findFirst();
  const threshold = settings?.lowStockAlert ?? 5;

  const products = await prisma.product.findMany({
    where: { active: true, stock: { lte: threshold } },
    include: { category: true },
    orderBy: { stock: "asc" },
  });

  return products.map(serializeProduct);
}
