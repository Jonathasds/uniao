import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { generateCode } from "@/lib/utils";
import type { QuoteStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { createSale } from "./sale.service";
import type { PaymentMethod } from "@prisma/client";

type QuoteItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export async function getQuotes(params: {
  page?: number;
  status?: QuoteStatus;
}) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const where: Prisma.QuoteWhereInput = params.status
    ? { status: params.status }
    : {};

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
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
    prisma.quote.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createQuote(params: {
  customerId: string;
  userId: string;
  items: QuoteItemInput[];
  discount: number;
  validUntil?: Date;
  notes?: string;
}) {
  const subtotal = params.items.reduce(
    (acc, i) => acc + i.unitPrice * i.quantity,
    0
  );
  const total = Math.max(0, subtotal - params.discount);
  const count = await prisma.quote.count();
  const code = generateCode("ORC", count + 1);

  return prisma.quote.create({
    data: {
      code,
      customerId: params.customerId,
      userId: params.userId,
      subtotal,
      discount: params.discount,
      total,
      validUntil: params.validUntil,
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
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  return prisma.quote.update({ where: { id }, data: { status } });
}

export async function convertQuoteToSale(
  quoteId: string,
  userId: string,
  paymentMethod: PaymentMethod = "PIX"
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });

  if (!quote || quote.status === "CANCELLED") {
    throw new Error("Orçamento inválido");
  }

  const sale = await createSale({
    customerId: quote.customerId,
    userId,
    items: quote.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    discount: Number(quote.discount),
    paymentMethod,
    status: "COMPLETED",
    notes: `Convertido do orçamento ${quote.code}`,
  });

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "APPROVED" },
  });

  return sale;
}

export async function getQuoteById(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: { include: { product: true } },
    },
  });
}
