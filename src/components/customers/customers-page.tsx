"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "@/app/actions/customers";
import type { Customer } from "@prisma/client";

type CustomersPageProps = {
  customers: (Customer & { _count: { sales: number } })[];
  totalPages: number;
  currentPage: number;
};

export function CustomersPage({
  customers,
  totalPages,
  currentPage,
}: CustomersPageProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = editing
        ? await updateCustomerAction(editing.id, formData)
        : await createCustomerAction(formData);
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Erro");
        return;
      }
      toast.success(editing ? "Cliente atualizado!" : "Cliente criado!");
      setOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">Gerencie sua base de clientes</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <form action="/clientes" method="GET">
        <Input name="search" placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." />
      </form>

      <DataTable
        data={customers}
        columns={[
          { key: "name", header: "Nome", cell: (c) => c.name },
          { key: "document", header: "CPF/CNPJ", cell: (c) => c.document },
          { key: "phone", header: "Telefone", cell: (c) => c.phone ?? "-" },
          { key: "email", header: "E-mail", cell: (c) => c.email ?? "-" },
          {
            key: "sales",
            header: "Compras",
            cell: (c) => c._count.sales,
          },
          {
            key: "actions",
            header: "",
            cell: (c) => (
              <div className="flex gap-1">
                <Link href={`/clientes/${c.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(c);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Excluir cliente?")) {
                      startTransition(async () => {
                        await deleteCustomerAction(c.id);
                        toast.success("Cliente excluído!");
                      });
                    }
                  }}
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
          window.location.href = `/clientes?page=${p}`;
        }}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar Cliente" : "Novo Cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ *</Label>
              <Input name="document" defaultValue={editing?.document} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>E-mail</Label>
              <Input name="email" type="email" defaultValue={editing?.email ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input name="address" defaultValue={editing?.address ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea name="notes" defaultValue={editing?.notes ?? ""} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
