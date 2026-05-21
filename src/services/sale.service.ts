import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { generateCode, toNumber } from "@/lib/utils";
import type { PaymentMethod, SaleStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

/**
 * Lista vendas com paginação.
 */
export async function getSales(params: {
  page?: number;
  search?: string;
  status?: SaleStatus;
}) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const where: Prisma.SaleWhereInput = {
    ...(params.status && { status: params.status }),
    ...(params.search && {
      OR: [
        { code: { contains: params.search, mode: "insensitive" } },
        { customer: { name: { contains: params.search, mode: "insensitive" } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: { select: { id: true, name: true, role: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Cria venda e atualiza estoque.
 */
export async function createSale(params: {
  customerId: string;
  userId: string;
  quoteId?: string;
  items: SaleItemInput[];
  discount: number;
  downPayment?: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  status: SaleStatus;
  notes?: string;
}) {
  const subtotal = params.items.reduce(
    (acc, i) => acc + i.unitPrice * i.quantity,
    0
  );
  const total = Math.max(0, subtotal - params.discount);

  const saleCount = await prisma.sale.count();
  const code = generateCode("VND", saleCount + 1);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        code,
        customerId: params.customerId,
        userId: params.userId,
        quoteId: params.quoteId,
        subtotal,
        discount: params.discount,
        downPayment: params.downPayment ?? 0,
        total,
        status: params.status,
        paymentMethod: params.paymentMethod,
        installments:
          params.paymentMethod === "CREDIT_CARD" ? params.installments ?? 1 : 1,
        notes: params.notes,
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (params.status === "COMPLETED") {
      for (const item of params.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: params.userId,
            type: "OUT",
            quantity: item.quantity,
            reason: `Venda ${code}`,
          },
        });
      }

      await tx.financialTransaction.create({
        data: {
          description:
            (params.downPayment ?? 0) > 0
              ? `Entrada venda ${code}`
              : `Venda ${code}`,
          amount: (params.downPayment ?? 0) > 0 ? (params.downPayment ?? 0) : total,
          type: "INCOME",
          category: "Vendas",
          saleId: sale.id,
        },
      });

      const serviceOrderCount = await tx.serviceOrder.count();
      const serviceOrder = await tx.serviceOrder.create({
        data: {
          code: generateCode("OS", serviceOrderCount + 1),
          saleId: sale.id,
          customerId: params.customerId,
          userId: params.userId,
          description: [
            `Ordem de serviço gerada automaticamente pela venda ${code}`,
            params.notes,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });

      return { ...sale, serviceOrder };
    }

    return sale;
  });
}

/**
 * Cria ou reutiliza uma venda pendente a partir de um orçamento aprovado.
 * @param quoteId - ID do orçamento de origem.
 * @param userId - ID do usuário responsável.
 * @returns Venda pendente vinculada ao orçamento.
 */
export async function createPendingSaleFromQuote(
  quoteId: string,
  userId: string
) {
  const existingSale = await prisma.sale.findFirst({
    where: { quoteId },
    include: { items: { include: { product: true } }, customer: true },
  });

  if (existingSale) return existingSale;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });

  if (!quote || quote.status === "CANCELLED") {
    throw new Error("Orçamento inválido");
  }

  return prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "APPROVED" },
    });

    const saleCount = await tx.sale.count();
    const code = generateCode("VND", saleCount + 1);
    const items = quote.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
    }));
    const subtotal = items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );
    const discount = toNumber(quote.discount);
    const total = Math.max(0, subtotal - discount);

    return tx.sale.create({
      data: {
        code,
        quoteId,
        customerId: quote.customerId,
        userId,
        subtotal,
        discount,
        total,
        status: "PENDING",
        paymentMethod: "PIX",
        installments: 1,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  });
}

/**
 * Finaliza uma venda pendente e gera estoque, financeiro e ordem de serviço.
 * @param params - Dados revisados na tela de nova venda.
 * @returns Venda finalizada.
 */
export async function completePendingSale(params: {
  saleId: string;
  customerId: string;
  userId: string;
  items: SaleItemInput[];
  discount: number;
  downPayment?: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  notes?: string;
}) {
  const subtotal = params.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - params.discount);

  return prisma.$transaction(async (tx) => {
    const existingSale = await tx.sale.findUnique({
      where: { id: params.saleId },
      include: { serviceOrder: true },
    });

    if (!existingSale) throw new Error("Venda não encontrada");
    if (existingSale.status !== "PENDING") {
      throw new Error("Esta venda não está aguardando finalização");
    }

    await tx.saleItem.deleteMany({ where: { saleId: params.saleId } });

    const sale = await tx.sale.update({
      where: { id: params.saleId },
      data: {
        customerId: params.customerId,
        userId: params.userId,
        subtotal,
        discount: params.discount,
        downPayment: params.downPayment ?? 0,
        total,
        status: "COMPLETED",
        paymentMethod: params.paymentMethod,
        installments:
          params.paymentMethod === "CREDIT_CARD" ? params.installments ?? 1 : 1,
        notes: params.notes,
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    for (const item of params.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          userId: params.userId,
          type: "OUT",
          quantity: item.quantity,
          reason: `Venda ${sale.code}`,
        },
      });
    }

    await tx.financialTransaction.create({
      data: {
        description:
          (params.downPayment ?? 0) > 0
            ? `Entrada venda ${sale.code}`
            : `Venda ${sale.code}`,
        amount: (params.downPayment ?? 0) > 0 ? (params.downPayment ?? 0) : total,
        type: "INCOME",
        category: "Vendas",
        saleId: sale.id,
      },
    });

    const serviceOrderCount = await tx.serviceOrder.count();
    const serviceOrder = existingSale.serviceOrder
      ? existingSale.serviceOrder
      : await tx.serviceOrder.create({
          data: {
            code: generateCode("OS", serviceOrderCount + 1),
            saleId: sale.id,
            customerId: params.customerId,
            userId: params.userId,
            description: [
              `Ordem de serviço gerada automaticamente pela venda ${sale.code}`,
              params.notes,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });

    return { ...sale, serviceOrder };
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: { include: { product: true } },
    },
  });
}

export async function getSaleByCode(code: string) {
  return prisma.sale.findUnique({
    where: { code },
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: { include: { product: true } },
    },
  });
}
