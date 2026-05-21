import { getProducts, getCategories } from "@/services/product.service";
import { ProductsPage } from "@/components/products/products-page";

type Props = {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>;
};

export default async function ProdutosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { data, totalPages } = await getProducts({
    page,
    search: params.search,
    categoryId: params.categoryId,
  });
  const categories = await getCategories();

  return (
    <ProductsPage
      initialData={data}
      categories={categories}
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
