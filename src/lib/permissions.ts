import type { UserRole } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/constants";

const SELLER_PREFIXES = ["/clientes", "/vendas", "/orcamentos"];
const EMPLOYEE_PREFIXES = ["/servicos"];

/**
 * Verifica se o perfil pode acessar a rota informada.
 * @param role - Perfil do usuário autenticado.
 * @param pathname - Caminho da URL.
 * @returns true quando o acesso é permitido.
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "ADMIN" || role === "MANAGER") {
    return true;
  }

  if (role === "SELLER") {
    return SELLER_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  if (role === "EMPLOYEE") {
    return EMPLOYEE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  return false;
}

/**
 * Retorna a rota inicial padrão conforme o perfil.
 * @param role - Perfil do usuário.
 * @returns Caminho de redirecionamento.
 */
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case "SELLER":
      return "/vendas";
    case "EMPLOYEE":
      return "/servicos";
    default:
      return "/";
  }
}

/**
 * Filtra itens do menu lateral conforme permissões do perfil.
 * @param role - Perfil do usuário.
 * @returns Itens de navegação permitidos.
 */
export function getNavItemsForRole(role: UserRole) {
  return NAV_ITEMS.filter((item) => canAccessRoute(role, item.href));
}

/**
 * Indica se o perfil pode criar, editar e excluir usuários do sistema.
 * @param role - Perfil do usuário.
 * @returns true apenas para administrador.
 */
export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Indica se o perfil pode criar, editar e excluir categorias de produtos.
 * @param role - Perfil do usuário.
 * @returns true apenas para administrador.
 */
export function canManageCategories(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Indica se o perfil pode acessar a página de configurações.
 * @param role - Perfil do usuário.
 * @returns true para administrador e gerente.
 */
export function canAccessSettings(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Indica se o perfil pode editar dados da empresa nas configurações.
 * @param role - Perfil do usuário.
 * @returns true para administrador e gerente.
 */
export function canEditCompany(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Indica se edição de venda existente exige senha de administrador.
 * @param role - Perfil do usuário.
 * @param hasExistingSale - Se está finalizando/editando venda já criada.
 * @returns true quando a senha do admin é obrigatória.
 */
export function requiresAdminPasswordForSale(
  role: UserRole,
  hasExistingSale: boolean
): boolean {
  return role === "MANAGER" && hasExistingSale;
}

/**
 * Perfis autorizados para operações de venda/orçamento/cliente.
 */
export const SALES_ROLES: UserRole[] = ["ADMIN", "MANAGER", "SELLER"];

/**
 * Perfis autorizados para ordens de serviço.
 */
export const SERVICE_ROLES: UserRole[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

/**
 * Perfis com acesso administrativo completo (exceto criar usuário para gerente).
 */
export const ADMIN_ROLES: UserRole[] = ["ADMIN", "MANAGER"];

/**
 * Valida se o perfil está entre os permitidos.
 * @param role - Perfil do usuário.
 * @param allowed - Lista de perfis aceitos.
 * @returns true quando permitido.
 */
export function hasRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}
