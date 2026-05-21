import { getAllCustomers } from "@/services/customer.service";
import { getAllProducts } from "@/services/product.service";
import { NewQuotePage } from "@/components/quotes/new-quote-page";

export default async function NovoOrcamentoPage() {
  const [customers, products] = await Promise.all([
    getAllCustomers(),
    getAllProducts(),
  ]);
  return <NewQuotePage customers={customers} products={products} />;
}
