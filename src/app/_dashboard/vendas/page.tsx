import { getSales } from "@/services/sale.service";
import { SalesPage } from "@/components/sales/sales-page";
import { toNumber } from "@/lib/utils";
import { serializeProduct } from "@/services/product.service";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function VendasPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { data, totalPages } = await getSales({ page });

  return (
    <SalesPage
      sales={data.map((s) => ({
        ...s,
        subtotal: toNumber(s.subtotal),
        discount: toNumber(s.discount),
        downPayment: toNumber(s.downPayment),
        total: toNumber(s.total),
        items: s.items.map((i) => ({
          ...i,
          unitPrice: toNumber(i.unitPrice),
          total: toNumber(i.total),
          product: serializeProduct(i.product),
        })),
      }))}
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
