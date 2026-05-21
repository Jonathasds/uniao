"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { GLASS_COLORS, GLASS_THICKNESSES } from "@/lib/constants";
import { formatCurrency, formatGlassDimensions, toNumber } from "@/lib/utils";
import type { GlassColor, GlassThickness } from "@prisma/client";
import { toast } from "sonner";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/actions/products";
import type { ProductWithCategory } from "@/types";
import type { Category } from "@prisma/client";
import Image from "next/image";

type ProductsPageProps = {
  initialData: ProductWithCategory[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
};

export function ProductsPage({
  initialData,
  categories,
  totalPages,
  currentPage,
}: ProductsPageProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (product: ProductWithCategory) => {
    setEditing(product);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editing
        ? await updateProductAction(editing.id, formData)
        : await createProductAction(formData);

      if (result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Verifique os campos"
        );
        return;
      }

      toast.success(editing ? "Produto atualizado!" : "Produto criado!");
      setOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este produto?")) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Produto excluído!");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-sm text-slate-500">
            Cadastro de vidros temperados — cor, espessura e medidas em milímetros
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="relative flex-1" action="/produtos" method="GET">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="search"
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="pl-10"
          />
        </form>
        <form action="/produtos" method="GET" className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            placeholder="Categoria"
            options={[
              { value: "all", label: "Todas" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <input
            type="hidden"
            name="categoryId"
            value={categoryFilter === "all" ? "" : categoryFilter}
          />
        </form>
      </div>

      <DataTable
        data={initialData}
        columns={[
          {
            key: "image",
            header: "",
            cell: (p) =>
              p.image ? (
                <Image
                  src={p.image}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
              ),
          },
          {
            key: "name",
            header: "Produto",
            cell: (p) => (
              <div>
                <p className="font-medium text-slate-900">{p.name}</p>
                {p.description && (
                  <p className="line-clamp-1 text-xs text-slate-500">
                    {p.description}
                  </p>
                )}
              </div>
            ),
          },
          { key: "sku", header: "SKU", cell: (p) => p.sku },
          {
            key: "glass",
            header: "Vidro",
            cell: (p) =>
              p.glassColor && p.glassThickness ? (
                <div className="text-sm">
                  <p>{GLASS_COLORS[p.glassColor as GlassColor]}</p>
                  <p className="text-xs text-slate-500">
                    {GLASS_THICKNESSES[p.glassThickness as GlassThickness]}
                  </p>
                </div>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "dimensions",
            header: "Medidas",
            cell: (p) => formatGlassDimensions(p.heightMm, p.widthMm),
          },
          {
            key: "category",
            header: "Categoria",
            cell: (p) => p.category.name,
          },
          {
            key: "salePrice",
            header: "Preço",
            cell: (p) => formatCurrency(toNumber(p.salePrice)),
          },
          {
            key: "stock",
            header: "Estoque",
            cell: (p) => (
              <Badge variant={p.stock === 0 ? "warning" : "success"}>
                {p.stock}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (p) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(p)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          window.location.href = `/produtos?page=${p}`;
        }}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar Produto" : "Novo Produto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do produto *</Label>
            <Textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              placeholder="Ex.: Porta de vidro temperado para box, com bisel..."
              required
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cor do vidro *</Label>
              <select
                name="glassColor"
                defaultValue={editing?.glassColor ?? "INCOLOR"}
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                {Object.entries(GLASS_COLORS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Espessura do vidro *</Label>
              <select
                name="glassThickness"
                defaultValue={editing?.glassThickness ?? "MM_8"}
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                {Object.entries(GLASS_THICKNESSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Altura (mm) *</Label>
              <Input
                name="heightMm"
                type="number"
                min={1}
                step={1}
                placeholder="Ex.: 2100"
                defaultValue={editing?.heightMm ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Largura (mm) *</Label>
              <Input
                name="widthMm"
                type="number"
                min={1}
                step={1}
                placeholder="Ex.: 800"
                defaultValue={editing?.widthMm ?? ""}
                required
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Medidas em milímetros: altura × largura (ex.: 2100 × 800 mm).
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input name="sku" defaultValue={editing?.sku} required />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <select
                name="categoryId"
                defaultValue={editing?.categoryId}
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input name="barcode" defaultValue={editing?.barcode ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda *</Label>
              <Input
                name="salePrice"
                type="number"
                step="0.01"
                defaultValue={editing ? toNumber(editing.salePrice) : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estoque *</Label>
              <Input
                name="stock"
                type="number"
                defaultValue={editing?.stock ?? 0}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>URL da Imagem</Label>
            <Input name="image" defaultValue={editing?.image ?? ""} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
