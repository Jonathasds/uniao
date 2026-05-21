/**
 * Gera imagem QR Code (data URL) a partir do payload PIX.
 * @param payload - String EMV do PIX (copia e cola).
 * @returns Data URL PNG ou null se falhar.
 */
export async function createPixQrDataUrl(payload: string): Promise<string | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(payload, {
      margin: 1,
      width: 220,
    });
  } catch {
    return null;
  }
}
