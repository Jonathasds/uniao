import { auth } from "@/lib/auth";
import { requiresAdminPasswordForSale } from "@/lib/permissions";
import { getAllCustomers } from "@/services/customer.service";
import { getAllProducts, serializeProduct } from "@/services/product.service";
import { getQuoteById } from "@/services/quote.service";
import { getSaleById } from "@/services/sale.service";
import { NewSalePage } from "@/components/sales/new-sale-page";
import { toNumber } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ quoteId?: string; saleId?: string }>;
};

/**
 * Carrega dados da nova venda, com preenchimento opcional por orçamento.
 * @param props - Parâmetros da rota, incluindo quoteId opcional.
 * @returns Página de nova venda.
 */
export default async function NovaVendaPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const [customers, products, quote, sale] = await Promise.all([
    getAllCustomers(),
    getAllProducts(),
    params.quoteId && !params.saleId
      ? getQuoteById(params.quoteId)
      : Promise.resolve(null),
    params.saleId ? getSaleById(params.saleId) : Promise.resolve(null),
  ]);

  return (
    <NewSalePage
      customers={customers}
      products={products}
      initialSale={
        sale
          ? {
              id: sale.id,
              code: sale.code,
              customerId: sale.customerId,
              discount: toNumber(sale.discount),
              downPayment: toNumber(sale.downPayment),
              paymentMethod: sale.paymentMethod,
              installments: sale.installments,
              notes: sale.notes,
              items: sale.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: toNumber(item.unitPrice),
                product: serializeProduct(item.product),
              })),
            }
          : undefined
      }
      requiresAdminPassword={requiresAdminPasswordForSale(
        session?.user?.role ?? "SELLER",
        Boolean(params.saleId && sale)
      )}
      initialQuote={
        quote
          ? {
              id: quote.id,
              code: quote.code,
              customerId: quote.customerId,
              discount: toNumber(quote.discount),
              items: quote.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: toNumber(item.unitPrice),
                product: serializeProduct(item.product),
              })),
            }
          : undefined
      }
    />
  );
}
