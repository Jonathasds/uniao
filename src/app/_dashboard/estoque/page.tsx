import { getStockMovements, getLowStockProducts } from "@/services/stock.service";
import { getAllProducts } from "@/services/product.service";
import { StockPage } from "@/components/stock/stock-page";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function EstoquePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [movements, lowStock, products] = await Promise.all([
    getStockMovements({ page }),
    getLowStockProducts(),
    getAllProducts(),
  ]);

  return (
    <StockPage
      movements={movements.data}
      lowStock={lowStock}
      products={products}
      totalPages={movements.totalPages}
      currentPage={page}
    />
  );
}
