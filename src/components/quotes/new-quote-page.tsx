"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createQuoteAction } from "@/app/actions/quotes";
import type { Customer } from "@prisma/client";
import type { ProductWithCategory } from "@/types";

type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type NewQuotePageProps = {
  customers: Customer[];
  products: ProductWithCategory[];
};

export function NewQuotePage({ customers, products }: NewQuotePageProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState("");

  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const addProduct = () => {
    const p = products.find((x) => x.id === selectedProduct);
    if (!p) return;
    setItems((prev) => {
      const ex = prev.find((i) => i.productId === p.id);
      if (ex) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unitPrice: Number(p.salePrice),
          quantity: 1,
        },
      ];
    });
    setSelectedProduct("");
  };

  const handleSubmit = () => {
    if (!customerId || !items.length) {
      toast.error("Preencha cliente e produtos");
      return;
    }
    startTransition(async () => {
      const result = await createQuoteAction({
        customerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Orçamento criado!");
        router.push("/orcamentos");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Orçamento</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Selecione"
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                    placeholder="Produto"
                    options={products.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                  />
                </div>
                <Button onClick={addProduct}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-16"
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.productId === item.productId
                              ? {
                                  ...i,
                                  quantity: parseInt(e.target.value) || 1,
                                }
                              : i
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setItems((prev) =>
                          prev.filter((i) => i.productId !== item.productId)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desconto</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <p className="text-lg font-bold text-primary">
              Total: {formatCurrency(total)}
            </p>
            <Button className="w-full" onClick={handleSubmit} disabled={pending}>
              Criar Orçamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
