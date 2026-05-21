"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { updateServiceOrderStatusAction } from "@/app/actions/service-orders";
import type { ServiceOrderStatus } from "@prisma/client";

type ServiceOrderStatusActionsProps = {
  orderId: string;
  status: ServiceOrderStatus;
};

const nextActions: Partial<
  Record<ServiceOrderStatus, { status: ServiceOrderStatus; label: string }>
> = {
  OPEN: { status: "IN_PROGRESS", label: "Iniciar serviço" },
  IN_PROGRESS: { status: "COMPLETED", label: "Concluir serviço" },
};

/**
 * Exibe ações para avançar ou cancelar uma ordem de serviço.
 * @param props - ID e status atual da ordem.
 * @returns Botões de alteração de status, quando aplicáveis.
 */
export function ServiceOrderStatusActions({
  orderId,
  status,
}: ServiceOrderStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const nextAction = nextActions[status];

  /**
   * Envia a alteração de status para o servidor.
   * @param nextStatus - Próximo status da ordem de serviço.
   * @returns void
   */
  const updateStatus = (nextStatus: ServiceOrderStatus) => {
    startTransition(async () => {
      const result = await updateServiceOrderStatusAction(orderId, nextStatus);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Status da ordem atualizado!");
      router.refresh();
    });
  };

  /**
   * Trata o clique na ação principal conforme o próximo status.
   * @returns void
   */
  const handleNextAction = () => {
    if (!nextAction) return;

    if (nextAction.status === "IN_PROGRESS") {
      setStartConfirmOpen(true);
      return;
    }

    updateStatus(nextAction.status);
  };

  /**
   * Confirma o início do serviço após o aviso de conferência.
   * @returns void
   */
  const confirmStartService = () => {
    setStartConfirmOpen(false);
    updateStatus("IN_PROGRESS");
  };

  if (status === "COMPLETED" || status === "CANCELLED") {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {nextAction && (
          <Button disabled={pending} onClick={handleNextAction}>
            {nextAction.label}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => updateStatus("CANCELLED")}
        >
          Cancelar OS
        </Button>
      </div>

      <Modal
        open={startConfirmOpen}
        onOpenChange={setStartConfirmOpen}
        title="Antes de iniciar o serviço"
        description="Confira os itens abaixo para evitar retrabalho."
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-2 text-sm text-amber-950">
              <p>
                Confira se todas as <strong>ferramentas</strong> necessárias estão
                disponíveis e em bom estado.
              </p>
              <p>
                Confira o <strong>material do cliente</strong> vinculado a esta ordem
                de serviço.
              </p>
            </div>
          </div>
          <p className="text-center text-base font-semibold text-primary">
            Tempo é dinheiro
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() => setStartConfirmOpen(false)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={pending}
              onClick={confirmStartService}
            >
              Confirmar e iniciar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
