import { notFound } from "next/navigation";
import Link from "next/link";
import { getSaleById } from "@/services/sale.service";
import { getCompanySettings } from "@/services/settings.service";
import { getDefaultPixKeyForReceipt } from "@/services/pix-key.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";
import { PAYMENT_METHODS, SALE_STATUS } from "@/lib/constants";
import { UserAttribution } from "@/components/shared/user-attribution";
import { SaleReceipt } from "@/components/sales/sale-receipt";
import { serializeProduct } from "@/services/product.service";

type Props = { params: Promise<{ id: string }> };

export default async function VendaDetailPage({ params }: Props) {
  const { id } = await params;
  const [sale, company, defaultPixKey] = await Promise.all([
    getSaleById(id),
    getCompanySettings(),
    getDefaultPixKeyForReceipt(),
  ]);

  if (!sale) notFound();

  const safeSale = {
    ...sale,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    downPayment: toNumber(sale.downPayment),
    total: toNumber(sale.total),
    items: sale.items.map((i) => ({
      ...i,
      unitPrice: toNumber(i.unitPrice),
      total: toNumber(i.total),
      product: serializeProduct(i.product),
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{sale.code}</h1>
            <p className="text-sm text-slate-500">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>
        </div>
        <SaleReceipt
          sale={safeSale}
          company={{
            name: company.name,
            document: company.document,
            email: company.email,
            phone: company.phone,
            address: company.address,
            logo: company.logo,
          }}
          defaultPixKey={
            defaultPixKey
              ? {
                  label: defaultPixKey.label,
                  key: defaultPixKey.key,
                  keyType: defaultPixKey.keyType,
                }
              : null
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Cliente:</span> {safeSale.customer.name}
            </p>
            <p>
              <span className="text-slate-500">Responsável:</span>{" "}
              <UserAttribution name={safeSale.user.name} role={safeSale.user.role} />
            </p>
            <p>
              <span className="text-slate-500">Pagamento:</span>{" "}
              {PAYMENT_METHODS[safeSale.paymentMethod]}
            </p>
            {safeSale.paymentMethod === "CREDIT_CARD" && (
              <p>
                <span className="text-slate-500">Parcelas:</span>{" "}
                {safeSale.installments}x
              </p>
            )}
            {safeSale.downPayment > 0 && (
              <p>
                <span className="text-slate-500">Entrada:</span>{" "}
                {formatCurrency(safeSale.downPayment)}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              <Badge
                variant={
                  safeSale.status === "COMPLETED" ? "success" : "warning"
                }
              >
                {SALE_STATUS[safeSale.status]}
              </Badge>
            </div>
            {safeSale.notes && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Observação / prazo de entrega
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-700">
                  {safeSale.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safeSale.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.product.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(toNumber(item.total))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(toNumber(safeSale.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto</span>
                <span>-{formatCurrency(toNumber(safeSale.discount))}</span>
              </div>
              {safeSale.downPayment > 0 && (
                <div className="flex justify-between">
                  <span>Entrada</span>
                  <span>{formatCurrency(safeSale.downPayment)}</span>
                </div>
              )}
              {safeSale.downPayment > 0 && (
                <div className="flex justify-between">
                  <span>Saldo restante</span>
                  <span>
                    {formatCurrency(
                      Math.max(0, safeSale.total - safeSale.downPayment)
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(toNumber(safeSale.total))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
