"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
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
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import {
  updateCompanyAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/actions/settings";
import { USER_ROLES } from "@/lib/constants";
import { UserConnectionBadge } from "@/components/presence/user-connection-badge";
import { UsersPresenceSync } from "@/components/presence/users-presence-sync";
import { SettingsPixTab, type PixKeyRow } from "@/components/settings/settings-pix-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompanySettingsClient } from "@/types";
import type { UserRole } from "@prisma/client";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  isOnline: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  _count: { products: number };
};

type SettingsPageProps = {
  company: CompanySettingsClient;
  users: UserRow[];
  categories: CategoryRow[];
  pixKeys: PixKeyRow[];
  currentUserId: string;
  canManageUsers: boolean;
  canManageCategories: boolean;
  canEditCompany: boolean;
};

export function SettingsPage({
  company,
  users,
  categories,
  pixKeys,
  currentUserId,
  canManageUsers,
  canManageCategories,
  canEditCompany,
}: SettingsPageProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(
    null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    company.logo ?? null
  );

  useEffect(() => {
    setLogoPreview(company.logo ?? null);
  }, [company.logo]);

  const handleCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEditCompany) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCompanyAction(fd);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Configurações salvas!");
        if ("warning" in result && result.warning) {
          toast.warning(result.warning);
        }
        router.refresh();
      }
    });
  };

  const handleUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUserAction(fd);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Usuário criado!");
        setShowUserForm(false);
        router.refresh();
      }
    });
  };

  /**
   * Cadastra uma nova categoria de produto.
   * @param e - Evento do formulário.
   * @returns void
   */
  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageCategories) return;

    const nameInput = categoryFormRef.current?.elements.namedItem(
      "categoryName"
    ) as HTMLInputElement | null;
    const name = nameInput?.value.trim() ?? "";

    if (name.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await createCategoryAction(name);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Categoria criada!");
      categoryFormRef.current?.reset();
      router.refresh();
    });
  };

  /**
   * Confirma a exclusão da categoria selecionada no modal.
   * @returns void
   */
  const confirmDeleteCategory = () => {
    if (!canManageCategories || !categoryToDelete) return;

    const { id } = categoryToDelete;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria removida!");
      setCategoryToDelete(null);
      router.refresh();
    });
  };

  /**
   * Confirma a exclusão do usuário selecionado no modal.
   * @returns void
   */
  const confirmDeleteUser = () => {
    if (!canManageUsers || !userToDelete) return;

    const { id } = userToDelete;
    startTransition(async () => {
      const result = await deleteUserAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.deactivated) {
        toast.success(
          "Usuário desativado (possui vendas, orçamentos ou serviços vinculados)"
        );
      } else {
        toast.success("Usuário excluído!");
      }

      setUserToDelete(null);
      router.refresh();
    });
  };

  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser || !canManageUsers) return;

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUserAction(editingUser.id, fd);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Usuário atualizado!");
        setEditingUser(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">
          {canManageUsers
            ? "Empresa, PIX, usuários e categorias"
            : canEditCompany
              ? "Empresa e chaves PIX"
              : "Dados da empresa"}
        </p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          {canEditCompany && <TabsTrigger value="pix">PIX</TabsTrigger>}
          {canManageCategories && (
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          )}
          {canManageUsers && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
        </TabsList>

        <TabsContent value="empresa">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCompany}
            encType="multipart/form-data"
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                name="name"
                defaultValue={company.name}
                disabled={!canEditCompany}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                name="document"
                defaultValue={company.document ?? ""}
                disabled={!canEditCompany}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                name="email"
                type="email"
                defaultValue={company.email ?? ""}
                disabled={!canEditCompany}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                name="phone"
                defaultValue={company.phone ?? ""}
                disabled={!canEditCompany}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input
                name="address"
                defaultValue={company.address ?? ""}
                disabled={!canEditCompany}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Logo da empresa</Label>
              <input type="hidden" name="logo" value={company.logo ?? ""} />
              {logoPreview && (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Image
                    src={logoPreview}
                    alt="Logo da empresa"
                    width={96}
                    height={96}
                    className="max-h-24 max-w-24 object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Input
                type="file"
                name="logoFile"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={!canEditCompany}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    setLogoPreview(company.logo ?? null);
                    return;
                  }
                  setLogoPreview(URL.createObjectURL(file));
                }}
              />
              <p className="text-xs text-slate-500">
                PNG, JPG, WebP ou GIF. Tamanho máximo de 2 MB.
              </p>
            </div>
            {canEditCompany && (
              <div className="sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Salvar Empresa
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
        </TabsContent>

        {canEditCompany && (
          <TabsContent value="pix">
            <SettingsPixTab pixKeys={pixKeys} />
          </TabsContent>
        )}

        {canManageCategories && (
          <TabsContent value="categorias">
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            ref={categoryFormRef}
            onSubmit={handleCreateCategory}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="category-name">Nova categoria</Label>
              <Input
                id="category-name"
                name="categoryName"
                placeholder="Ex.: Box, Portas, Espelhos..."
                required
                minLength={2}
              />
            </div>
            <Button type="submit" disabled={pending}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </form>

          <DataTable
            data={categories}
            emptyMessage="Nenhuma categoria cadastrada"
            columns={[
              { key: "name", header: "Categoria", cell: (c) => c.name },
              {
                key: "products",
                header: "Produtos",
                cell: (c) => (
                  <span className="text-slate-600">{c._count.products}</span>
                ),
              },
              {
                key: "actions",
                header: "",
                cell: (c: CategoryRow) => (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      title="Remover categoria"
                      onClick={() => setCategoryToDelete(c)}
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
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="usuarios">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuários</CardTitle>
            <Button size="sm" onClick={() => setShowUserForm(!showUserForm)}>
              Novo Usuário
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showUserForm && (
              <form
                onSubmit={handleUser}
                className="grid gap-3 rounded-lg border border-slate-100 p-4 sm:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <select
                    name="role"
                    className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  >
                    {Object.entries(USER_ROLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="sm:col-span-2">
                  Criar
                </Button>
              </form>
            )}
            <UsersPresenceSync
              initialOnlineByUserId={Object.fromEntries(
                users.map((u) => [u.id, u.isOnline])
              )}
            >
              {(onlineByUserId) => (
                <DataTable
                  data={users}
                  columns={[
                    { key: "name", header: "Nome", cell: (u) => u.name },
                    { key: "email", header: "E-mail", cell: (u) => u.email },
                    {
                      key: "role",
                      header: "Perfil",
                      cell: (u) => USER_ROLES[u.role],
                    },
                    {
                      key: "connection",
                      header: "Conexão",
                      cell: (u) => (
                        <UserConnectionBadge
                          online={onlineByUserId[u.id] ?? u.isOnline}
                        />
                      ),
                    },
                    {
                      key: "active",
                      header: "Conta",
                      cell: (u) => (
                        <Badge variant={u.active ? "success" : "danger"}>
                          {u.active ? "Ativo" : "Inativo"}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      header: "",
                      cell: (u: UserRow) => (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(u)}
                            title="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={pending || u.id === currentUserId}
                            title={
                              u.id === currentUserId
                                ? "Você não pode excluir sua própria conta"
                                : "Excluir usuário"
                            }
                            onClick={() => setUserToDelete(u)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </UsersPresenceSync>
          </CardContent>
        </Card>
          </TabsContent>
        )}
      </Tabs>

      <Modal
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Excluir usuário"
        description="Esta ação não pode ser desfeita."
      >
        {userToDelete && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="space-y-2 text-sm text-red-950">
                <p>
                  Tem certeza que deseja excluir o usuário{" "}
                  <strong>{userToDelete.name}</strong> ({userToDelete.email})?
                </p>
                <p className="text-red-800">
                  Se o usuário tiver vendas, orçamentos ou serviços registrados,
                  ele será apenas desativado para preservar o histórico.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setUserToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={pending}
                onClick={confirmDeleteUser}
              >
                {pending ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Excluir categoria"
        description="Esta ação não pode ser desfeita."
      >
        {categoryToDelete && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="space-y-2 text-sm text-red-950">
                <p>
                  Tem certeza que deseja excluir a categoria{" "}
                  <strong>{categoryToDelete.name}</strong>?
                </p>
                {categoryToDelete._count.products > 0 && (
                  <p className="text-red-800">
                    {categoryToDelete._count.products} produto(s) vinculado(s)
                    serão excluídos ou movidos para &quot;Arquivado&quot; se já
                    tiverem sido usados em vendas ou orçamentos.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={pending}
                onClick={confirmDeleteCategory}
              >
                {pending ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        title="Editar Usuário"
        description="Altere os dados do usuário. Deixe a senha em branco para mantê-la."
      >
        {editingUser && (
          <form onSubmit={handleEditUser} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome</Label>
              <Input name="name" defaultValue={editingUser.name} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>E-mail</Label>
              <Input
                name="email"
                type="email"
                defaultValue={editingUser.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nova senha (opcional)</Label>
              <Input
                name="password"
                type="password"
                placeholder="Deixe em branco para não alterar"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <select
                name="role"
                defaultValue={editingUser.role}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                {Object.entries(USER_ROLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Status</Label>
              <select
                name="active"
                defaultValue={editingUser.active ? "true" : "false"}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={pending}>
                Salvar alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
