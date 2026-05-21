"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { STOCK_MOVEMENT_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { createStockMovementAction } from "@/app/actions/stock";
import type { StockMovementWithProduct } from "@/types";
import type { ProductWithCategory, SerializedProduct } from "@/types";

type StockPageProps = {
  movements: StockMovementWithProduct[];
  lowStock: ProductWithCategory[];
  products: SerializedProduct[];
  totalPages: number;
  currentPage: number;
};

export function StockPage({
  movements,
  lowStock,
  products,
  totalPages,
  currentPage,
}: StockPageProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createStockMovementAction({
        productId: fd.get("productId") as string,
        type,
        quantity: Number(fd.get("quantity")),
        reason: (fd.get("reason") as string) || undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Movimentação registrada!");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
          <p className="text-sm text-slate-500">Movimentações e alertas</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Settings2 className="h-4 w-4" />
          Nova Movimentação
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">
            {lowStock.length} produto(s) com estoque baixo
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} — {p.stock} un. em estoque
              </li>
            ))}
          </ul>
        </div>
      )}

      <DataTable
        data={movements}
        columns={[
          {
            key: "product",
            header: "Produto",
            cell: (m) => m.product.name,
          },
          {
            key: "type",
            header: "Tipo",
            cell: (m) => (
              <Badge
                variant={
                  m.type === "IN"
                    ? "success"
                    : m.type === "OUT"
                      ? "danger"
                      : "secondary"
                }
              >
                {m.type === "IN" && <ArrowDown className="mr-1 h-3 w-3 inline" />}
                {m.type === "OUT" && <ArrowUp className="mr-1 h-3 w-3 inline" />}
                {STOCK_MOVEMENT_TYPES[m.type]}
              </Badge>
            ),
          },
          { key: "qty", header: "Qtd", cell: (m) => m.quantity },
          { key: "reason", header: "Motivo", cell: (m) => m.reason ?? "-" },
          { key: "user", header: "Usuário", cell: (m) => m.user.name },
          { key: "date", header: "Data", cell: (m) => formatDate(m.createdAt) },
        ]}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          window.location.href = `/estoque?page=${p}`;
        }}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Movimentação de Estoque"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as typeof type)}
              options={[
                { value: "IN", label: "Entrada" },
                { value: "OUT", label: "Saída" },
                { value: "ADJUSTMENT", label: "Ajuste" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <select
              name="productId"
              required
              className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Est: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input name="quantity" type="number" min={1} required />
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input name="reason" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Registrar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
