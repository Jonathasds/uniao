import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@prisma/client";

type UserAttributionProps = {
  name: string;
  role: UserRole;
  className?: string;
};

/**
 * Exibe nome e perfil do usuário responsável pelo registro.
 * @param props - Nome e perfil do usuário.
 * @returns Texto formatado com nome e perfil.
 */
export function UserAttribution({ name, role, className }: UserAttributionProps) {
  return (
    <span className={className}>
      <span className="font-medium text-slate-700">{name}</span>
      <span className="text-slate-400"> · </span>
      <span className="text-slate-500">{USER_ROLES[role]}</span>
    </span>
  );
}
