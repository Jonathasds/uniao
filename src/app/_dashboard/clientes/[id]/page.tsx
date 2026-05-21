import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/services/customer.service";
import { getCompanySettings } from "@/services/settings.service";
import { getDefaultPixKeyForReceipt } from "@/services/pix-key.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerSalesHistory } from "@/components/customers/customer-sales-history";
import { ArrowLeft } from "lucide-react";
import { toNumber } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;
  const [customer, company, defaultPixKey] = await Promise.all([
    getCustomerById(id),
    getCompanySettings(),
    getDefaultPixKeyForReceipt(),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-sm text-slate-500">{customer.document}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Telefone:</span>{" "}
              {customer.phone ?? "-"}
            </p>
            <p>
              <span className="text-slate-500">E-mail:</span>{" "}
              {customer.email ?? "-"}
            </p>
            <p>
              <span className="text-slate-500">Endereço:</span>{" "}
              {customer.address ?? "-"}
            </p>
            {customer.notes && (
              <p>
                <span className="text-slate-500">Obs:</span> {customer.notes}
              </p>
            )}
            <p>
              <span className="text-slate-500">Total de compras:</span>{" "}
              {customer._count.sales}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSalesHistory
              defaultPixKey={
                defaultPixKey
                  ? {
                      label: defaultPixKey.label,
                      key: defaultPixKey.key,
                      keyType: defaultPixKey.keyType,
                    }
                  : null
              }
              company={{
                name: company.name,
                document: company.document,
                email: company.email,
                phone: company.phone,
                address: company.address,
                logo: company.logo,
              }}
              customer={{
                name: customer.name,
                document: customer.document,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
              }}
              sales={customer.sales.map((sale) => ({
                id: sale.id,
                code: sale.code,
                subtotal: toNumber(sale.subtotal),
                discount: toNumber(sale.discount),
                downPayment: toNumber(sale.downPayment),
                total: toNumber(sale.total),
                createdAt: sale.createdAt,
                status: sale.status,
                paymentMethod: sale.paymentMethod,
                installments: sale.installments,
                notes: sale.notes,
                items: sale.items.map((item) => ({
                  productName: item.product.name,
                  sku: item.product.sku,
                  quantity: item.quantity,
                  unitPrice: toNumber(item.unitPrice),
                  total: toNumber(item.total),
                  image: item.product.image,
                })),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
