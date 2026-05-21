import { getQuotes } from "@/services/quote.service";
import { getCompanySettings } from "@/services/settings.service";
import { QuotesPage } from "@/components/quotes/quotes-page";
import { toNumber } from "@/lib/utils";
import { serializeProduct } from "@/services/product.service";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function OrcamentosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [{ data, totalPages }, company] = await Promise.all([
    getQuotes({ page }),
    getCompanySettings(),
  ]);

  return (
    <QuotesPage
      company={{
        name: company.name,
        document: company.document,
        email: company.email,
        phone: company.phone,
        address: company.address,
        logo: company.logo,
      }}
      quotes={data.map((q) => ({
        ...q,
        subtotal: toNumber(q.subtotal),
        discount: toNumber(q.discount),
        total: toNumber(q.total),
        items: q.items.map((i) => ({
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
