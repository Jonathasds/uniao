import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { CustomerFormData } from "@/lib/validations/customer";
import { Prisma } from "@prisma/client";

/**
 * Lista clientes com paginação e busca.
 */
export async function getCustomers(params: { page?: number; search?: string }) {
  const page = params.page ?? 1;
  const limit = ITEMS_PER_PAGE;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = params.search
    ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { document: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { sales: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Busca cliente com histórico de compras.
 */
export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { sales: true } },
      sales: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { include: { product: true } } },
      },
    },
  });
}

export async function createCustomer(data: CustomerFormData) {
  return prisma.customer.create({ data });
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  return prisma.customer.update({ where: { id }, data });
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({ where: { id } });
}

/** Lista todos os clientes (para selects). */
export async function getAllCustomers() {
  return prisma.customer.findMany({ orderBy: { name: "asc" } });
}
