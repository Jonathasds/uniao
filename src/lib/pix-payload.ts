import type { PixKeyType } from "@prisma/client";

/**
 * Calcula CRC16-CCITT (0xFFFF) usado no payload PIX (EMV).
 * @param payload - String sem o campo CRC final.
 * @returns CRC em hexadecimal com 4 dígitos.
 */
function crc16Ccitt(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Monta um campo EMV no formato ID + tamanho + valor.
 * @param id - Identificador do campo (2 dígitos).
 * @param value - Conteúdo do campo.
 * @returns Campo formatado.
 */
function emvField(id: string, value: string): string {
  const size = String(value.length).padStart(2, "0");
  return `${id}${size}${value}`;
}

/**
 * Normaliza a chave PIX conforme o tipo informado.
 * @param key - Chave informada pelo usuário.
 * @param keyType - Tipo da chave PIX.
 * @returns Chave normalizada para o payload.
 */
export function normalizePixKey(key: string, keyType: PixKeyType): string {
  const trimmed = key.trim();

  switch (keyType) {
    case "CPF":
    case "CNPJ":
    case "PHONE":
      return trimmed.replace(/\D/g, "");
    case "EMAIL":
      return trimmed.toLowerCase();
    default:
      return trimmed;
  }
}

/**
 * Gera o payload EMV estático (copia e cola) para QR Code PIX.
 * @param options - Dados da chave e do recebedor.
 * @returns String do payload PIX (BR Code).
 */
export function buildStaticPixPayload(options: {
  pixKey: string;
  keyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amount?: number;
}): string {
  const pixKey = normalizePixKey(options.pixKey, options.keyType);
  const merchantName = options.merchantName.trim().substring(0, 25).toUpperCase();
  const merchantCity = options.merchantCity.trim().substring(0, 15).toUpperCase();

  const merchantAccount =
    emvField("00", "br.gov.bcb.pix") + emvField("01", pixKey);

  let payload =
    emvField("00", "01") +
    emvField("26", merchantAccount) +
    emvField("52", "0000") +
    emvField("53", "986") +
    emvField("58", "BR") +
    emvField("59", merchantName) +
    emvField("60", merchantCity);

  if (options.amount != null && options.amount > 0) {
    const amount = options.amount.toFixed(2);
    payload += emvField("54", amount);
  }

  payload += emvField("62", emvField("05", "***"));
  payload += "6304";

  return payload + crc16Ccitt(payload);
}

/**
 * Extrai uma cidade curta a partir do endereço da empresa.
 * @param address - Endereço completo.
 * @returns Nome de cidade para o payload PIX.
 */
export function extractMerchantCity(address?: string | null): string {
  if (!address?.trim()) return "BRASIL";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return city.substring(0, 15).toUpperCase() || "BRASIL";
}
