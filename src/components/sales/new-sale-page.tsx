"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/use-cart-store";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { toast } from "sonner";
import { createSaleAction } from "@/app/actions/sales";
import type { Customer } from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";
import type { ProductWithCategory, SerializedProduct } from "@/types";

type NewSalePageProps = {
  customers: Customer[];
  products: ProductWithCategory[];
  initialSale?: {
    id: string;
    code: string;
    customerId: string;
    discount: number;
    downPayment: number;
    paymentMethod: PaymentMethod;
    installments: number;
    notes: string | null;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      product: SerializedProduct;
    }[];
  };
  initialQuote?: {
    id: string;
    code: string;
    customerId: string;
    discount: number;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      product: SerializedProduct;
    }[];
  };
  requiresAdminPassword?: boolean;
};

export function NewSalePage({
  customers,
  products,
  initialSale,
  initialQuote,
  requiresAdminPassword = false,
}: NewSalePageProps) {
  const router = useRouter();
  const initializedSourceId = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [installments, setInstallments] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const [discountMode, setDiscountMode] = useState<"money" | "percent">("money");
  const [discountInput, setDiscountInput] = useState("");
  const [notes, setNotes] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const {
    items,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();
  const showsDownPayment = paymentMethod === "PIX" || paymentMethod === "CASH";
  const showsInstallments = paymentMethod === "CREDIT_CARD";
  const visibleItems = mounted ? items : [];
  const visibleSubtotal = mounted ? getSubtotal() : 0;
  const visibleTotal = mounted ? getTotal() : 0;
  const visibleDiscount = mounted ? discount : 0;
  const parsedDownPayment = parseFloat(downPaymentInput) || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const parsedDiscount = parseFloat(discountInput) || 0;
    const nextDiscount =
      discountMode === "percent"
        ? (visibleSubtotal * parsedDiscount) / 100
        : parsedDiscount;

    setDiscount(Math.max(0, nextDiscount));
  }, [discountInput, discountMode, mounted, setDiscount, visibleSubtotal]);

  useEffect(() => {
    const source = initialSale ?? initialQuote;

    if (!source || initializedSourceId.current === source.id) {
      return;
    }

    initializedSourceId.current = source.id;
    clearCart();
    setCustomerId(source.customerId);
    setDiscount(source.discount);
    setDiscountMode("money");
    setDiscountInput(source.discount > 0 ? String(source.discount) : "");

    if (initialSale) {
      setPaymentMethod(initialSale.paymentMethod);
      setInstallments(initialSale.installments);
      setDownPaymentInput(
        initialSale.downPayment > 0 ? String(initialSale.downPayment) : ""
      );
      setNotes(initialSale.notes ?? "");
    }

    for (const item of source.items) {
      addItem({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        stock: item.product.stock,
      });
    }
  }, [addItem, clearCart, initialQuote, initialSale, setDiscount]);

  /**
   * Adiciona o produto selecionado ao carrinho da venda.
   * @returns void
   */
  const handleAddProduct = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: Number(product.salePrice),
      stock: product.stock,
    });
    setSelectedProduct("");
  };

  /**
   * Finaliza a venda, aprova o orçamento de origem quando existir e cria a OS.
   * @returns void
   */
  const handleSubmit = () => {
    if (!customerId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!items.length) {
      toast.error("Adicione produtos à venda");
      return;
    }
    if (showsDownPayment && parsedDownPayment < 0) {
      toast.error("O valor de entrada não pode ser negativo");
      return;
    }
    if (showsDownPayment && parsedDownPayment > getTotal()) {
      toast.error("O valor de entrada não pode ser maior que o total");
      return;
    }
    if (showsInstallments && installments < 1) {
      toast.error("Informe a quantidade de parcelas");
      return;
    }
    if (requiresAdminPassword && !adminPassword.trim()) {
      toast.error("Informe a senha do administrador para finalizar esta venda");
      return;
    }

    startTransition(async () => {
      const result = await createSaleAction({
        saleId: initialSale?.id,
        customerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
        downPayment: showsDownPayment ? parsedDownPayment : 0,
        paymentMethod,
        installments: showsInstallments ? installments : 1,
        status: "COMPLETED",
        quoteId: initialQuote?.id,
        notes: notes.trim() || undefined,
        adminPassword: requiresAdminPassword ? adminPassword : undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      clearCart();
      setDownPaymentInput("");
      setInstallments(1);
      setDiscountInput("");
      setDiscountMode("money");
      setNotes("");
      toast.success(`Venda ${result.code} criada e ordem de serviço enviada!`);
      router.push(
        result.serviceOrderId
          ? `/servicos/${result.serviceOrderId}`
          : `/vendas/${result.saleId}`
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>
        <p className="text-sm text-slate-500">
          {initialQuote
            ? `Revise a venda gerada pelo orçamento ${initialQuote.code}`
            : initialSale
              ? `Finalize a venda ${initialSale.code}`
              : "Registre uma nova venda"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Selecione o cliente"
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                    placeholder="Selecione um produto"
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} - ${formatCurrency(Number(p.salePrice))} (Est: ${p.stock})`,
                    }))}
                  />
                </div>
                <Button onClick={handleAddProduct} disabled={!selectedProduct}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {visibleItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.productId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-20"
                    />
                    <span className="w-24 text-right text-sm font-medium">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observação / Prazo de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="sale-notes">Observação</Label>
              <Textarea
                id="sale-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex: entregar os produtos em até 7 dias úteis, agendar instalação para sexta-feira..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  const nextPaymentMethod = v as PaymentMethod;
                  setPaymentMethod(nextPaymentMethod);
                  if (nextPaymentMethod !== "PIX" && nextPaymentMethod !== "CASH") {
                    setDownPaymentInput("");
                  }
                  if (nextPaymentMethod !== "CREDIT_CARD") {
                    setInstallments(1);
                  }
                }}
                options={Object.entries(PAYMENT_METHODS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            </div>
            {showsInstallments && (
              <div className="space-y-2">
                <Label>Quantidade de parcelas</Label>
                <Select
                  value={String(installments)}
                  onValueChange={(value) => setInstallments(Number(value))}
                  options={Array.from({ length: 12 }, (_, index) => {
                    const value = index + 1;
                    return {
                      value: String(value),
                      label: value === 1 ? "1 parcela" : `${value} parcelas`,
                    };
                  })}
                />
              </div>
            )}
            {showsDownPayment && (
              <div className="space-y-2">
                <Label>Valor de entrada (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  max={visibleTotal}
                  step="0.01"
                  value={downPaymentInput}
                  onChange={(e) => setDownPaymentInput(e.target.value)}
                  placeholder="Ex: 100,00"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Desconto</Label>
              <div className="grid grid-cols-[1fr_96px] gap-2">
                <Input
                  type="number"
                  min={0}
                  max={discountMode === "percent" ? 100 : undefined}
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={discountMode === "percent" ? "Ex: 10" : "Ex: 50,00"}
                />
                <Select
                  value={discountMode}
                  onValueChange={(value) =>
                    setDiscountMode(value as "money" | "percent")
                  }
                  options={[
                    { value: "money", label: "R$" },
                    { value: "percent", label: "%" },
                  ]}
                />
              </div>
              {discountMode === "percent" && (
                <p className="text-xs text-slate-500">
                  Desconto calculado: {formatCurrency(visibleDiscount)}
                </p>
              )}
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(visibleSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Desconto</span>
                <span>-{formatCurrency(visibleDiscount)}</span>
              </div>
              {showsDownPayment && parsedDownPayment > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Entrada</span>
                  <span>{formatCurrency(parsedDownPayment)}</span>
                </div>
              )}
              {showsDownPayment && parsedDownPayment > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo restante</span>
                  <span>
                    {formatCurrency(Math.max(0, visibleTotal - parsedDownPayment))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(visibleTotal)}</span>
              </div>
            </div>
            {requiresAdminPassword && (
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha do administrador</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Obrigatória para finalizar a venda"
                />
                <p className="text-xs text-slate-500">
                  Como gerente, confirme com a senha de um administrador.
                </p>
              </div>
            )}
            <Button className="w-full" onClick={handleSubmit} disabled={pending}>
              {pending ? "Finalizando..." : "Finalizar Venda"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
