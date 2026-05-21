import Image from "next/image";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export type CompanyBrandData = {
  name: string;
  logo?: string | null;
};

type CompanyBrandProps = CompanyBrandData & {
  compact?: boolean;
  className?: string;
};

/**
 * Exibe a marca da empresa (logo e nome) no layout do sistema.
 * @param props - Nome, logo e opções de exibição compacta.
 * @returns Bloco visual com logo e nome da loja.
 */
export function CompanyBrand({
  name,
  logo,
  compact = false,
  className,
}: CompanyBrandProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-primary/5">
        {logo ? (
          <Image
            src={logo}
            alt={name}
            width={36}
            height={36}
            className="h-full w-full object-contain p-0.5"
            unoptimized
          />
        ) : (
          <Boxes className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{name}</p>
        {!compact && (
          <p className="text-xs text-slate-400">Gestão Comercial</p>
        )}
      </div>
    </div>
  );
}
