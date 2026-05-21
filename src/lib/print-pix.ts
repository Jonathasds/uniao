import {
  buildStaticPixPayload,
  extractMerchantCity,
} from "@/lib/pix-payload";
import type { PrintCompany, PrintPixKey } from "@/utils/export";
import type { PaymentMethod, PixKeyType } from "@prisma/client";

type DefaultPixKeyInput = {
  label: string;
  key: string;
  keyType: PixKeyType;
};

/**
 * Indica se o comprovante deve exibir QR Code PIX.
 * @param paymentMethod - Forma de pagamento da venda.
 * @returns true para PIX ou dinheiro.
 */
export function shouldShowPixQrOnReceipt(paymentMethod: PaymentMethod): boolean {
  return paymentMethod === "PIX" || paymentMethod === "CASH";
}

/**
 * Monta dados da chave PIX para impressão no comprovante.
 * @param paymentMethod - Forma de pagamento da venda.
 * @param defaultPix - Chave PIX padrão cadastrada.
 * @param company - Dados da empresa no PDF.
 * @returns Dados do PIX ou undefined quando não aplicável.
 */
export function buildReceiptPixKey(
  paymentMethod: PaymentMethod,
  defaultPix: DefaultPixKeyInput | null,
  company: PrintCompany
): PrintPixKey | undefined {
  if (!defaultPix || !shouldShowPixQrOnReceipt(paymentMethod)) {
    return undefined;
  }

  return {
    label: defaultPix.label,
    key: defaultPix.key,
    payload: buildStaticPixPayload({
      pixKey: defaultPix.key,
      keyType: defaultPix.keyType,
      merchantName: company.name || "Loja",
      merchantCity: extractMerchantCity(company.address),
    }),
  };
}
