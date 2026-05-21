import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { toNumber } from "@/lib/utils";
import { serializeProduct } from "@/services/product.service";
import type { ServiceOrderWithRelations } from "@/types";
import type { Prisma, ServiceOrderStatus } from "@prisma/client";

const userAttributionSelect = {
  id: true,
  name: true,
  role: true,
} as const;

const serviceOrderListInclude = {
  customer: true,
  user: { select: userAttributionSelect },
  startedBy: { select: userAttributionSelect },
  completedBy: { select: userAttributionSelect },
  sale: {
    select: {
      id: true,
      code: true,
      status: true,
      paymentMethod: true,
      quoteId: true,
      installments: true,
      notes: true,
      subtotal: true,
      discount: true,
      downPayment: true,
      total: true,
      customerId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      customer: true,
      user: { select: { id: true, name: true, role: true } },
    },
  },
} as const;

const serviceOrderListQuery = { include: serviceOrderListInclude };

const serviceOrderDetailInclude = {
  customer: true,
  user: { select: userAttributionSelect },
  startedBy: { select: userAttributionSelect },
  completedBy: { select: userAttributionSelect },
  sale: {
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: { include: { product: true } },
    },
  },
} as const;

const serviceOrderDetailQuery = { include: serviceOrderDetailInclude };

type ServiceOrderListRecord = Prisma.ServiceOrderGetPayload<
  typeof serviceOrderListQuery
>;

type ServiceOrderDetailRecord = Prisma.ServiceOrderGetPayload<
  typeof serviceOrderDetailQuery
>;

/**
 * Serializa ordem da listagem (sem itens da venda).
 * @param order - Registro da listagem.
 * @returns Ordem pronta para Client Components.
 */
function serializeServiceOrderList(
  order: ServiceOrderListRecord
): ServiceOrderWithRelations {
  return {
    ...order,
    sale: {
      ...order.sale,
      subtotal: toNumber(order.sale.subtotal),
      discount: toNumber(order.sale.discount),
      downPayment: toNumber(order.sale.downPayment),
      total: toNumber(order.sale.total),
      items: [],
    },
  } as ServiceOrderWithRelations;
}

/**
 * Serializa ordem com venda completa e itens.
 * @param order - Registro detalhado.
 * @returns Ordem pronta para Client Components.
 */
function serializeServiceOrderDetail(order: ServiceOrderDetailRecord) {
  return {
    ...order,
    sale: {
      ...order.sale,
      subtotal: toNumber(order.sale.subtotal),
      discount: toNumber(order.sale.discount),
      downPayment: toNumber(order.sale.downPayment),
      total: toNumber(order.sale.total),
      items: order.sale.items.map((item) => ({
        ...item,
        unitPrice: toNumber(item.unitPrice),
        total: toNumber(item.total),
        product: serializeProduct(item.product),
      })),
    },
  };
}

/**
 * Lista ordens de serviço com paginação.
 * @param params - Parâmetros de paginação.
 * @returns Ordens de serviço paginadas.
 */
export async function getServiceOrders(params: { page?: number }) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const total = await prisma.serviceOrder.count();
  const data = await prisma.serviceOrder.findMany({
    ...serviceOrderListQuery,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return {
    data: data.map(serializeServiceOrderList),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca uma ordem de serviço pelo ID.
 * @param id - ID da ordem de serviço.
 * @returns Ordem encontrada ou null.
 */
export async function getServiceOrderById(id: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    ...serviceOrderDetailQuery,
  });

  return order ? serializeServiceOrderDetail(order) : null;
}

/**
 * Atualiza o status de uma ordem de serviço e registra o funcionário responsável.
 * @param id - ID da ordem de serviço.
 * @param status - Novo status da ordem.
 * @param actorUserId - ID do usuário que executou a ação.
 * @returns Ordem de serviço atualizada.
 */
export async function updateServiceOrderStatus(
  id: string,
  status: ServiceOrderStatus,
  actorUserId: string
) {
  const existing = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { startedById: true, completedById: true },
  });

  const data: Prisma.ServiceOrderUpdateInput = { status };

  if (status === "IN_PROGRESS" && !existing?.startedById) {
    data.startedBy = { connect: { id: actorUserId } };
  }

  if (status === "COMPLETED") {
    data.completedAt = new Date();
    data.completedBy = { connect: { id: actorUserId } };
  } else {
    data.completedAt = null;
    if (existing?.completedById) {
      data.completedBy = { disconnect: true };
    }
  }

  return prisma.serviceOrder.update({
    where: { id },
    data,
  });
}
