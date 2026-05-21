import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserConnectionBadgeProps = {
  online: boolean;
  className?: string;
};

/**
 * Exibe badge de conexão (online/offline) com indicador visual.
 * @param props - Estado de conexão e classes opcionais.
 * @returns Elemento de badge.
 */
export function UserConnectionBadge({ online, className }: UserConnectionBadgeProps) {
  return (
    <Badge
      variant={online ? "success" : "secondary"}
      className={cn("gap-1.5", className)}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          online ? "bg-emerald-500" : "bg-slate-400"
        )}
        aria-hidden
      />
      {online ? "Online" : "Offline"}
    </Badge>
  );
}
