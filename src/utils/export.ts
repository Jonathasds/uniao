import { createPixQrDataUrl } from "@/utils/pix-qr";
export type PrintCompany = {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
};

export type PrintCustomer = {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type PrintDocumentItem = {
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string | null;
};

export type PrintPixKey = {
  label: string;
  key: string;
  payload: string;
};

export type PrintCommercialDocument = {
  type: "Comprovante de Venda" | "Nota de Venda" | "Orçamento";
  code: string;
  createdAt: Date | string;
  company: PrintCompany;
  customer: PrintCustomer;
  items: PrintDocumentItem[];
  subtotal: number;
  discount?: number;
  downPayment?: number;
  total: number;
  paymentMethod?: string;
  installments?: number;
  notes?: string | null;
  pixKey?: PrintPixKey;
};

/**
 * Formata valores monetários para exibição no PDF.
 * @param value - Valor numérico.
 * @returns Valor formatado em reais.
 */
function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

/**
 * Formata data e hora para exibição no PDF.
 * @param value - Data que será formatada.
 * @returns Data e hora em pt-BR.
 */
function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Busca uma imagem e converte para data URL para uso no jsPDF.
 * @param src - URL absoluta, relativa ou data URL da imagem.
 * @returns Data URL da imagem ou null se não for possível carregar.
 */
async function imageToDataUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("data:")) return src;

  try {
    const response = await fetch(src);
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Identifica o formato da imagem a partir do data URL.
 * @param dataUrl - Imagem em data URL.
 * @returns Formato aceito pelo jsPDF.
 */
function getImageFormat(dataUrl: string) {
  if (dataUrl.startsWith("data:image/jpeg")) return "JPEG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "PNG";
}

/**
 * Exporta comprovante/nota/orçamento com dados da loja, cliente, prazo e produtos.
 * @param documentData - Dados comerciais que serão impressos.
 * @returns Promessa resolvida após disparar o download do PDF.
 */
export async function exportCommercialDocumentToPDF(
  documentData: PrintCommercialDocument
) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF();
  const logo = await imageToDataUrl(documentData.company.logo);
  const productImages = await Promise.all(
    documentData.items.map((item) => imageToDataUrl(item.image))
  );
  const hasProductImages = productImages.some(Boolean);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(10, 10, 190, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(documentData.type, 14, 22);
  doc.setFontSize(11);
  doc.text(`Nº ${documentData.code}`, 112, 18);
  doc.text(`Data da venda: ${formatDateTime(documentData.createdAt)}`, 112, 24);

  if (logo) {
    doc.addImage(logo, getImageFormat(logo), 14, 44, 18, 18);
  }

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(10, 34, 190, 58, 3, 3, "FD");

  const headerX = logo ? 36 : 14;
  const companyLines = [
    documentData.company.document && `CNPJ/CPF: ${documentData.company.document}`,
    documentData.company.phone && `Telefone: ${documentData.company.phone}`,
    documentData.company.email && `E-mail: ${documentData.company.email}`,
    documentData.company.address && `Endereço: ${documentData.company.address}`,
  ].filter(Boolean) as string[];

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.text("Dados da Loja", headerX, 43);
  doc.setFontSize(11);
  doc.text(documentData.company.name || "Loja", headerX, 50);
  doc.setFontSize(10);
  doc.text(
    companyLines,
    headerX,
    56,
    { maxWidth: logo ? 58 : 82, lineHeightFactor: 1.1 }
  );

  doc.setTextColor(15, 23, 42);
  const customerLines = [
    `Nome: ${documentData.customer.name}`,
    `Documento: ${documentData.customer.document ?? "-"}`,
    `Telefone: ${documentData.customer.phone ?? "-"}`,
    `E-mail: ${documentData.customer.email ?? "-"}`,
    `Endereço: ${documentData.customer.address ?? "-"}`,
  ];

  doc.setFontSize(13);
  doc.text("Dados do Cliente", 112, 43);
  doc.setFontSize(11);
  doc.text(documentData.customer.name, 112, 50);
  doc.setFontSize(10);
  doc.text(
    customerLines.slice(1),
    112,
    56,
    { maxWidth: 82, lineHeightFactor: 1.1 }
  );

  const notes = documentData.notes?.trim();
  const startY = 100;

  const tableHead = hasProductImages
    ? [["Foto", "Produto", "Qtd", "Unitário", "Total"]]
    : [["Produto", "Qtd", "Unitário", "Total"]];
  const tableBody = documentData.items.map((item, index) =>
    hasProductImages
      ? [
          productImages[index] ? " " : "",
          item.productName,
          item.quantity,
          formatMoney(item.unitPrice),
          formatMoney(item.total),
        ]
      : [
          item.productName,
          item.quantity,
          formatMoney(item.unitPrice),
          formatMoney(item.total),
        ]
  );

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY,
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: {
      fontSize: 10,
      minCellHeight: hasProductImages ? 19 : 10,
      valign: "middle",
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: hasProductImages
      ? {
          0: { cellWidth: 22, halign: "center" },
          1: { cellWidth: 80 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 32, halign: "right" },
        }
      : {
          0: { cellWidth: 98 },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 32, halign: "right" },
          3: { cellWidth: 32, halign: "right" },
        },
    didDrawCell: (data: {
      section: string;
      column: { index: number };
      row: { index: number };
      cell: { x: number; y: number };
    }) => {
      if (
        !hasProductImages ||
        data.section !== "body" ||
        data.column.index !== 0
      ) {
        return;
      }

      const image = productImages[data.row.index];
      if (!image) return;

      doc.addImage(
        image,
        getImageFormat(image),
        data.cell.x + 3,
        data.cell.y + 2.5,
        14,
        14
      );
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? startY;
  const summaryY = finalY + 10;
  const hasDownPayment = (documentData.downPayment ?? 0) > 0;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(112, summaryY, 88, hasDownPayment ? 39 : 27, 2, 2, "FD");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal", 118, summaryY + 8);
  doc.text(formatMoney(documentData.subtotal), 194, summaryY + 8, {
    align: "right",
  });
  doc.text("Desconto", 118, summaryY + 15);
  doc.text(formatMoney(documentData.discount ?? 0), 194, summaryY + 15, {
    align: "right",
  });
  if (hasDownPayment) {
    doc.text("Entrada", 118, summaryY + 22);
    doc.text(formatMoney(documentData.downPayment ?? 0), 194, summaryY + 22, {
      align: "right",
    });
    doc.text("Saldo restante", 118, summaryY + 29);
    doc.text(
      formatMoney(
        Math.max(0, documentData.total - (documentData.downPayment ?? 0))
      ),
      194,
      summaryY + 29,
      { align: "right" }
    );
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("Total", 118, summaryY + (hasDownPayment ? 37 : 24));
  doc.text(
    formatMoney(documentData.total),
    194,
    summaryY + (hasDownPayment ? 37 : 24),
    { align: "right" }
  );

  if (documentData.paymentMethod) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      [
        `Forma de pagamento: ${documentData.paymentMethod}`,
        (documentData.installments ?? 1) > 1 &&
          `${documentData.installments} parcelas`,
      ]
        .filter(Boolean)
        .join(" - "),
      14,
      summaryY + 8
    );
  }

  let footerY = summaryY + (hasDownPayment ? 49 : 37);

  if (notes) {
    const noteLines = doc.splitTextToSize(notes, 182) as string[];
    const boxHeight = Math.max(14, noteLines.length * 5 + 8);

    doc.setFillColor(255, 251, 235);
    doc.roundedRect(10, footerY, 190, boxHeight, 2, 2, "F");
    doc.setTextColor(120, 53, 15);
    doc.setFontSize(10);
    doc.text(noteLines, 14, footerY + 8);
    doc.setTextColor(15, 23, 42);
    footerY += boxHeight + 8;
  }

  if (documentData.pixKey) {
    const qrDataUrl = await createPixQrDataUrl(documentData.pixKey.payload);

    const qrSize = 42;
    const boxHeight = 62;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(10, footerY, 190, boxHeight, 2, 2, "FD");
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", 16, footerY + 8, qrSize, qrSize);
    }
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text("Pagamento via PIX", 66, footerY + 16);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Chave: ${documentData.pixKey.label}`, 66, footerY + 24);
    doc.text(documentData.pixKey.key, 66, footerY + 31, { maxWidth: 120 });
    doc.setFontSize(8);
    doc.text("Escaneie o QR Code para pagar", 66, footerY + 42);
  }

  doc.save(`${documentData.code}.pdf`);
}

/**
 * Exporta dados para PDF.
 * @param title - Título do documento
 * @param headers - Cabeçalhos das colunas
 * @param rows - Linhas de dados
 * @param filename - Nome do arquivo
 */
export async function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 30);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 38,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Exporta dados para Excel.
 * @param data - Array de objetos
 * @param filename - Nome do arquivo
 * @param sheetName - Nome da planilha
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Dados"
) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
