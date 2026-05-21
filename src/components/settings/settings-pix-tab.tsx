"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { PIX_KEY_TYPES } from "@/lib/constants";
import {
  createPixKeyAction,
  deletePixKeyAction,
  updatePixKeyAction,
} from "@/app/actions/pix-keys";
import type { PixKeyType } from "@prisma/client";

export type PixKeyRow = {
  id: string;
  label: string;
  key: string;
  keyType: PixKeyType;
  isDefault: boolean;
};

type SettingsPixTabProps = {
  pixKeys: PixKeyRow[];
};

/**
 * Aba de cadastro e gestão de chaves PIX.
 * @param props - Lista inicial de chaves.
 * @returns Seção de configuração PIX.
 */
export function SettingsPixTab({ pixKeys }: SettingsPixTabProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<PixKeyRow | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<PixKeyRow | null>(null);

  /**
   * Cadastra nova chave PIX.
   * @param e - Evento do formulário.
   * @returns void
   */
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPixKeyAction(fd);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Chave PIX cadastrada!");
      setShowForm(false);
      formRef.current?.reset();
      router.refresh();
    });
  };

  /**
   * Atualiza chave PIX em edição.
   * @param e - Evento do formulário.
   * @returns void
   */
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingKey) return;

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePixKeyAction(editingKey.id, fd);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Chave PIX atualizada!");
      setEditingKey(null);
      router.refresh();
    });
  };

  /**
   * Confirma exclusão da chave selecionada.
   * @returns void
   */
  const confirmDelete = () => {
    if (!keyToDelete) return;

    const { id } = keyToDelete;
    startTransition(async () => {
      const result = await deletePixKeyAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Chave PIX excluída!");
      setKeyToDelete(null);
      router.refresh();
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Chaves PIX</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Usadas no QR Code do comprovante em vendas PIX ou dinheiro.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Nova chave
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form
              ref={formRef}
              onSubmit={handleCreate}
              className="grid gap-3 rounded-lg border border-slate-100 p-4 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome / apelido</Label>
                <Input
                  name="label"
                  placeholder="Ex.: Loja matriz"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo da chave</Label>
                <select
                  name="keyType"
                  className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  defaultValue="RANDOM"
                >
                  {Object.entries(PIX_KEY_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  name="key"
                  placeholder="CPF, e-mail, telefone ou aleatória"
                  required
                  minLength={3}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  id="pix-default-new"
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="pix-default-new" className="font-normal">
                  Definir como chave padrão no comprovante
                </Label>
              </div>
              <Button type="submit" disabled={pending} className="sm:col-span-2">
                Cadastrar
              </Button>
            </form>
          )}

          <DataTable
            data={pixKeys}
            emptyMessage="Nenhuma chave PIX cadastrada"
            columns={[
              { key: "label", header: "Nome", cell: (row) => row.label },
              {
                key: "keyType",
                header: "Tipo",
                cell: (row) => PIX_KEY_TYPES[row.keyType],
              },
              {
                key: "key",
                header: "Chave",
                cell: (row) => (
                  <span className="font-mono text-xs text-slate-700">
                    {row.key}
                  </span>
                ),
              },
              {
                key: "default",
                header: "Padrão",
                cell: (row) =>
                  row.isDefault ? (
                    <Badge variant="success">Sim</Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  ),
              },
              {
                key: "actions",
                header: "",
                cell: (row: PixKeyRow) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar chave"
                      onClick={() => setEditingKey(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir chave"
                      disabled={pending}
                      onClick={() => setKeyToDelete(row)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal
        open={!!editingKey}
        onOpenChange={(open) => !open && setEditingKey(null)}
        title="Editar chave PIX"
      >
        {editingKey && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome / apelido</Label>
              <Input
                name="label"
                defaultValue={editingKey.label}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo da chave</Label>
              <select
                name="keyType"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                defaultValue={editingKey.keyType}
              >
                {Object.entries(PIX_KEY_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                name="key"
                defaultValue={editingKey.key}
                required
                minLength={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                id="pix-default-edit"
                defaultChecked={editingKey.isDefault}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="pix-default-edit" className="font-normal">
                Chave padrão no comprovante
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditingKey(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!keyToDelete}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        title="Excluir chave PIX"
        description="Esta ação não pode ser desfeita."
      >
        {keyToDelete && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-950">
                Excluir a chave <strong>{keyToDelete.label}</strong> (
                {keyToDelete.key})?
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setKeyToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={pending}
                onClick={confirmDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
