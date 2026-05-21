import bcrypt from "bcryptjs";
import "dotenv/config";
import type {
  GlassColor,
  GlassThickness,
  PaymentMethod,
  QuoteStatus,
  SaleStatus,
  ServiceOrderStatus,
} from "@prisma/client";
import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

type ProductSeed = {
  name: string;
  sku: string;
  categoryName: string;
  description: string;
  salePrice: number;
  stock: number;
  glassColor?: GlassColor;
  glassThickness?: GlassThickness;
  heightMm?: number;
  widthMm?: number;
};

const CATEGORY_NAMES = [
  "Vidros Temperados",
  "Esquadrias Linha Suprema",
  "Esquadrias Linha Gold",
  "Esquadrias Linha 25 e 16",
  "Box e Engenharia",
  "Portas e Janelas",
  "Ferragens e Acessórios",
] as const;

const PRODUCTS: ProductSeed[] = [
  {
    name: "Vidro temperado incolor 8mm",
    sku: "VT-INC-8-1200x800",
    categoryName: "Vidros Temperados",
    description: "Vidro temperado incolor 8 mm para janelas e divisórias.",
    salePrice: 485,
    stock: 40,
    glassColor: "INCOLOR",
    glassThickness: "MM_8",
    heightMm: 1200,
    widthMm: 800,
  },
  {
    name: "Vidro temperado fumê 8mm",
    sku: "VT-FUM-8-1200x2000",
    categoryName: "Vidros Temperados",
    description: "Vidro temperado fumê 8 mm para fachadas e sacadas.",
    salePrice: 720,
    stock: 28,
    glassColor: "FUME",
    glassThickness: "MM_8",
    heightMm: 2000,
    widthMm: 1200,
  },
  {
    name: "Vidro temperado verde 10mm",
    sku: "VT-VER-10-900x900",
    categoryName: "Vidros Temperados",
    description: "Vidro temperado verde 10 mm para controle solar.",
    salePrice: 590,
    stock: 22,
    glassColor: "VERDE",
    glassThickness: "MM_10",
    heightMm: 900,
    widthMm: 900,
  },
  {
    name: "Vidro refletivo 8mm",
    sku: "VT-REF-8-1500x600",
    categoryName: "Vidros Temperados",
    description: "Vidro refletivo 8 mm para fachadas comerciais.",
    salePrice: 940,
    stock: 15,
    glassColor: "REFLETIVO",
    glassThickness: "MM_8",
    heightMm: 1500,
    widthMm: 600,
  },
  {
    name: "Vidro temperado incolor 10mm (box)",
    sku: "VT-INC-10-2000x800",
    categoryName: "Vidros Temperados",
    description: "Vidro temperado incolor 10 mm para box de banheiro.",
    salePrice: 1180,
    stock: 18,
    glassColor: "INCOLOR",
    glassThickness: "MM_10",
    heightMm: 2000,
    widthMm: 800,
  },
  {
    name: "Vidro temperado incolor 6mm",
    sku: "VT-INC-6-1000x500",
    categoryName: "Vidros Temperados",
    description: "Vidro temperado incolor 6 mm para prateleiras e tampos.",
    salePrice: 320,
    stock: 35,
    glassColor: "INCOLOR",
    glassThickness: "MM_6",
    heightMm: 1000,
    widthMm: 500,
  },
  {
    name: "Perfil Linha Suprema 50mm natural",
    sku: "SUP-PER-50-NAT-6000",
    categoryName: "Esquadrias Linha Suprema",
    description: "Perfil principal Linha Suprema 50 mm, acabamento natural, barra 6 m.",
    salePrice: 420,
    stock: 80,
  },
  {
    name: "Marco fixo Linha Suprema branco",
    sku: "SUP-MAR-FIX-BR-1400",
    categoryName: "Esquadrias Linha Suprema",
    description: "Marco fixo Linha Suprema 1,40 m, pintura branco fosco.",
    salePrice: 385,
    stock: 45,
  },
  {
    name: "Folha móvel Linha Suprema branco",
    sku: "SUP-FOL-MOV-BR-1400",
    categoryName: "Esquadrias Linha Suprema",
    description: "Folha móvel Linha Suprema 1,40 m, sistema deslizante.",
    salePrice: 510,
    stock: 38,
  },
  {
    name: "Trilho superior Linha Gold",
    sku: "GLD-TRI-SUP-3000",
    categoryName: "Esquadrias Linha Gold",
    description: "Trilho superior Linha Gold 3 m, acabamento anodizado champagne.",
    salePrice: 265,
    stock: 60,
  },
  {
    name: "Marco Linha Gold 2 folhas",
    sku: "GLD-MAR-2F-1500",
    categoryName: "Esquadrias Linha Gold",
    description: "Marco para janela de correr 2 folhas Linha Gold, vão 1,50 m.",
    salePrice: 890,
    stock: 24,
  },
  {
    name: "Kit engenharia Linha Gold 4 folhas",
    sku: "GLD-KIT-ENG-4F",
    categoryName: "Esquadrias Linha Gold",
    description: "Kit engenharia Linha Gold para vão de até 4,20 m com 4 folhas.",
    salePrice: 3280,
    stock: 8,
  },
  {
    name: "Trilho inferior Linha 25",
    sku: "L25-TRI-INF-3000",
    categoryName: "Esquadrias Linha 25 e 16",
    description: "Trilho inferior Linha 25, barra 3 m, uso residencial.",
    salePrice: 198,
    stock: 55,
  },
  {
    name: "Folha móvel Linha 16 cromada",
    sku: "L16-FOL-CRO-1200",
    categoryName: "Esquadrias Linha 25 e 16",
    description: "Folha móvel Linha 16 1,20 m, acabamento cromado.",
    salePrice: 345,
    stock: 42,
  },
  {
    name: "Contra-marco Linha 25",
    sku: "L25-CON-MAR-3000",
    categoryName: "Esquadrias Linha 25 e 16",
    description: "Contra-marco Linha 25 para fixação em alvenaria, 3 m.",
    salePrice: 175,
    stock: 70,
  },
  {
    name: "Kit box fronta vidro 8mm",
    sku: "BOX-KIT-FRT-8",
    categoryName: "Box e Engenharia",
    description: "Kit box de canto com vidro temperado 8 mm incolor e perfis Linha 25.",
    salePrice: 2450,
    stock: 12,
    glassColor: "INCOLOR",
    glassThickness: "MM_8",
    heightMm: 1900,
    widthMm: 900,
  },
  {
    name: "Kit engenharia box até 1,20m",
    sku: "BOX-ENG-1200",
    categoryName: "Box e Engenharia",
    description: "Kit engenharia para box até 1,20 m, roldanas e vedação inclusos.",
    salePrice: 680,
    stock: 30,
  },
  {
    name: "Porta de correr 2 folhas Linha Gold",
    sku: "JAN-GOLD-2F-1500",
    categoryName: "Portas e Janelas",
    description: "Janela/porta de correr 2 folhas Linha Gold, vão 1,50 m (sem vidro).",
    salePrice: 1950,
    stock: 10,
  },
  {
    name: "Porta pivotante vidro 10mm",
    sku: "PTA-PIV-10-2100",
    categoryName: "Portas e Janelas",
    description: "Sistema pivotante para porta de vidro temperado 10 mm, altura 2,10 m.",
    salePrice: 1420,
    stock: 14,
    glassColor: "INCOLOR",
    glassThickness: "MM_10",
    heightMm: 2100,
    widthMm: 900,
  },
  {
    name: "Roldana dupla com rolamento",
    sku: "FER-ROL-DUP",
    categoryName: "Ferragens e Acessórios",
    description: "Roldana dupla com rolamento para esquadrias de correr.",
    salePrice: 48,
    stock: 200,
  },
  {
    name: "Fechadura eletromagnética box",
    sku: "FER-FEC-ELET",
    categoryName: "Ferragens e Acessórios",
    description: "Fechadura eletromagnética para porta de box.",
    salePrice: 185,
    stock: 45,
  },
  {
    name: "Silicone neutro estrutural",
    sku: "FER-SIL-NEU",
    categoryName: "Ferragens e Acessórios",
    description: "Silicone neutro estrutural para vedação de vidros, cartucho 300 ml.",
    salePrice: 32,
    stock: 120,
  },
];

/**
 * Remove vendas, orçamentos, produtos e categorias antigas do banco.
 * @returns void
 */
async function clearCommercialData() {
  await prisma.financialTransaction.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
}

async function main() {
  console.log("🌱 Iniciando seed — vidros temperados e esquadrias...");

  await clearCommercialData();
  console.log("   Dados comerciais anteriores removidos.");

  const password = await bcrypt.hash("ua042728", 10);

  const admin = await prisma.user.upsert({
    where: { email: "jonathadelgado@gmail.com" },
    update: { password },
    create: {
      name: "Administrador",
      email: "jonathadelgado@gmail.com",
      password,
      role: "ADMIN",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "vendedor@uniao.com" },
    update: {},
    create: {
      name: "João Vendedor",
      email: "vendedor@uniao.com",
      password: await bcrypt.hash("vendedor123", 10),
      role: "SELLER",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "funcionario@uniao.com" },
    update: {},
    create: {
      name: "Carlos Montador",
      email: "funcionario@uniao.com",
      password: await bcrypt.hash("funcionario123", 10),
      role: "EMPLOYEE",
    },
  });

  await prisma.user.upsert({
    where: { email: "gerente@uniao.com" },
    update: {},
    create: {
      name: "Maria Gerente",
      email: "gerente@uniao.com",
      password: await bcrypt.hash("gerente123", 10),
      role: "MANAGER",
    },
  });

  const categoryMap = new Map<string, string>();
  for (const name of CATEGORY_NAMES) {
    const category = await prisma.category.create({ data: { name } });
    categoryMap.set(name, category.id);
  }

  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.categoryName)!;
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId,
        description: p.description,
        salePrice: p.salePrice,
        stock: p.stock,
        glassColor: p.glassColor,
        glassThickness: p.glassThickness,
        heightMm: p.heightMm,
        widthMm: p.widthMm,
        active: true,
      },
    });
    products.push(product);
  }

  const customersData = [
    {
      name: "Construtora Horizonte Ltda",
      document: "12345678000190",
      phone: "(11) 3456-7890",
      email: "obras@horizonte.com.br",
      address: "Av. Industrial, 1200 - Guarulhos/SP",
      notes: "Cliente corporativo — condomínios residenciais",
    },
    {
      name: "Arquitetura & Vidros Silva",
      document: "23456789000181",
      phone: "(11) 98877-6655",
      email: "projetos@arquiteturavidros.com",
      address: "Rua dos Arquitetos, 88 - São Paulo/SP",
    },
    {
      name: "Marmoraria Premium",
      document: "34567890000172",
      phone: "(21) 3344-5566",
      email: "compras@marmorariapremium.com",
      address: "Rod. BR-101, km 12 - Niterói/RJ",
    },
    {
      name: "Residencial Parque das Águas",
      document: "45678901000163",
      phone: "(31) 3210-9876",
      email: "sindico@parquedasaguas.com",
      address: "Rua das Palmeiras, 500 - Belo Horizonte/MG",
    },
    {
      name: "Felipe Andrade",
      document: "52998224725",
      phone: "(41) 99876-5432",
      email: "felipe.andrade@email.com",
      address: "Rua XV de Novembro, 234 - Curitiba/PR",
    },
    {
      name: "Vidraçaria Central",
      document: "56789012000154",
      phone: "(51) 3555-6677",
      email: "vendas@vidracariacentral.com",
      address: "Av. Borges de Medeiros, 890 - Porto Alegre/RS",
    },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { document: c.document },
      update: c,
      create: c,
    });
    customers.push(customer);
  }

  const existingCompany = await prisma.companySettings.findFirst();
  const companyData = {
    name: "União Vidros & Esquadrias",
    document: "12345678000199",
    email: "contato@uniaovidros.com.br",
    phone: "(11) 4000-1234",
    address: "Rua das Esquadrias, 250 - São Paulo/SP",
    lowStockAlert: 5,
  };

  if (existingCompany) {
    await prisma.companySettings.update({
      where: { id: existingCompany.id },
      data: companyData,
    });
  } else {
    await prisma.companySettings.create({ data: companyData });
  }

  const findProduct = (sku: string) => products.find((p) => p.sku === sku)!;

  const quotesData: {
    code: string;
    customerIndex: number;
    userId: string;
    status: QuoteStatus;
    items: { sku: string; qty: number }[];
    discount: number;
    notes?: string;
    daysAgo: number;
  }[] = [
    {
      code: "ORC-000001",
      customerIndex: 0,
      userId: seller.id,
      status: "PENDING",
      items: [
        { sku: "VT-FUM-8-1200x2000", qty: 8 },
        { sku: "GLD-MAR-2F-1500", qty: 6 },
      ],
      discount: 0,
      notes: "Fachada bloco B — aguardando aprovação da engenharia",
      daysAgo: 2,
    },
    {
      code: "ORC-000002",
      customerIndex: 1,
      userId: seller.id,
      status: "APPROVED",
      items: [
        { sku: "VT-INC-10-2000x800", qty: 12 },
        { sku: "BOX-KIT-FRT-8", qty: 12 },
        { sku: "FER-SIL-NEU", qty: 24 },
      ],
      discount: 450,
      notes: "Projeto apartamentos — Linha Gold e box",
      daysAgo: 5,
    },
    {
      code: "ORC-000003",
      customerIndex: 2,
      userId: admin.id,
      status: "PENDING",
      items: [
        { sku: "VT-INC-6-1000x500", qty: 20 },
        { sku: "VT-VER-10-900x900", qty: 6 },
      ],
      discount: 0,
      daysAgo: 1,
    },
    {
      code: "ORC-000004",
      customerIndex: 3,
      userId: seller.id,
      status: "PENDING",
      items: [
        { sku: "SUP-MAR-FIX-BR-1400", qty: 40 },
        { sku: "SUP-FOL-MOV-BR-1400", qty: 40 },
        { sku: "L25-TRI-INF-3000", qty: 30 },
      ],
      discount: 800,
      notes: "Troca de esquadrias áreas comuns — Linha Suprema",
      daysAgo: 7,
    },
    {
      code: "ORC-000005",
      customerIndex: 4,
      userId: seller.id,
      status: "CANCELLED",
      items: [{ sku: "PTA-PIV-10-2100", qty: 1 }],
      discount: 0,
      notes: "Cliente desistiu do projeto",
      daysAgo: 14,
    },
    {
      code: "ORC-000006",
      customerIndex: 5,
      userId: seller.id,
      status: "APPROVED",
      items: [
        { sku: "GLD-KIT-ENG-4F", qty: 4 },
        { sku: "VT-REF-8-1500x600", qty: 16 },
        { sku: "FER-ROL-DUP", qty: 32 },
      ],
      discount: 0,
      daysAgo: 10,
    },
  ];

  for (const q of quotesData) {
    const customer = customers[q.customerIndex];
    const lineItems = q.items.map((item) => {
      const product = findProduct(item.sku);
      const unitPrice = Number(product.salePrice);
      return {
        productId: product.id,
        quantity: item.qty,
        unitPrice: product.salePrice,
        total: unitPrice * item.qty,
      };
    });
    const subtotal = lineItems.reduce((acc, i) => acc + Number(i.total), 0);
    const total = subtotal - q.discount;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - q.daysAgo);

    await prisma.quote.create({
      data: {
        code: q.code,
        customerId: customer.id,
        userId: q.userId,
        subtotal,
        discount: q.discount,
        total,
        status: q.status,
        notes: q.notes,
        createdAt,
        items: { create: lineItems },
      },
    });
  }

  const salesData: {
    code: string;
    customerIndex: number;
    userId: string;
    status: SaleStatus;
    paymentMethod: PaymentMethod;
    items: { sku: string; qty: number }[];
    discount: number;
    downPayment: number;
    installments: number;
    daysAgo: number;
    serviceStatus?: ServiceOrderStatus;
    startedById?: string;
    completedById?: string;
  }[] = [
    {
      code: "VND-000001",
      customerIndex: 1,
      userId: seller.id,
      status: "COMPLETED",
      paymentMethod: "PIX",
      items: [
        { sku: "VT-INC-10-2000x800", qty: 12 },
        { sku: "BOX-KIT-FRT-8", qty: 12 },
      ],
      discount: 450,
      downPayment: 5000,
      installments: 1,
      daysAgo: 4,
      serviceStatus: "IN_PROGRESS",
      startedById: employee.id,
    },
    {
      code: "VND-000002",
      customerIndex: 0,
      userId: seller.id,
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      items: [
        { sku: "VT-FUM-8-1200x2000", qty: 6 },
        { sku: "GLD-TRI-SUP-3000", qty: 12 },
      ],
      discount: 0,
      downPayment: 0,
      installments: 3,
      daysAgo: 8,
      serviceStatus: "COMPLETED",
      startedById: employee.id,
      completedById: employee.id,
    },
    {
      code: "VND-000003",
      customerIndex: 5,
      userId: admin.id,
      status: "COMPLETED",
      paymentMethod: "PIX",
      items: [
        { sku: "GLD-KIT-ENG-4F", qty: 2 },
        { sku: "VT-REF-8-1500x600", qty: 8 },
      ],
      discount: 200,
      downPayment: 3000,
      installments: 1,
      daysAgo: 12,
      serviceStatus: "OPEN",
    },
    {
      code: "VND-000004",
      customerIndex: 4,
      userId: seller.id,
      status: "PENDING",
      paymentMethod: "PIX",
      items: [{ sku: "PTA-PIV-10-2100", qty: 2 }],
      discount: 0,
      downPayment: 800,
      installments: 1,
      daysAgo: 1,
    },
    {
      code: "VND-000005",
      customerIndex: 2,
      userId: seller.id,
      status: "COMPLETED",
      paymentMethod: "DEBIT_CARD",
      items: [
        { sku: "VT-INC-8-1200x800", qty: 10 },
        { sku: "L16-FOL-CRO-1200", qty: 20 },
      ],
      discount: 150,
      downPayment: 0,
      installments: 1,
      daysAgo: 15,
      serviceStatus: "COMPLETED",
      startedById: employee.id,
      completedById: employee.id,
    },
    {
      code: "VND-000006",
      customerIndex: 3,
      userId: seller.id,
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      items: [
        { sku: "SUP-PER-50-NAT-6000", qty: 25 },
        { sku: "SUP-MAR-FIX-BR-1400", qty: 25 },
      ],
      discount: 600,
      downPayment: 2000,
      installments: 1,
      daysAgo: 3,
    },
    {
      code: "VND-000007",
      customerIndex: 0,
      userId: admin.id,
      status: "COMPLETED",
      paymentMethod: "PIX",
      items: [{ sku: "JAN-GOLD-2F-1500", qty: 8 }],
      discount: 0,
      downPayment: 0,
      installments: 1,
      daysAgo: 20,
      serviceStatus: "OPEN",
    },
    {
      code: "VND-000008",
      customerIndex: 5,
      userId: seller.id,
      status: "CANCELLED",
      paymentMethod: "CASH",
      items: [{ sku: "FER-FEC-ELET", qty: 10 }],
      discount: 0,
      downPayment: 0,
      installments: 1,
      daysAgo: 25,
    },
  ];

  for (const s of salesData) {
    const customer = customers[s.customerIndex];
    const lineItems = s.items.map((item) => {
      const product = findProduct(item.sku);
      const unitPrice = Number(product.salePrice);
      return {
        productId: product.id,
        quantity: item.qty,
        unitPrice: product.salePrice,
        total: unitPrice * item.qty,
      };
    });
    const subtotal = lineItems.reduce((acc, i) => acc + Number(i.total), 0);
    const total = subtotal - s.discount;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - s.daysAgo);

    const sale = await prisma.sale.create({
      data: {
        code: s.code,
        customerId: customer.id,
        userId: s.userId,
        subtotal,
        discount: s.discount,
        downPayment: s.downPayment,
        total,
        status: s.status,
        paymentMethod: s.paymentMethod,
        installments: s.installments,
        createdAt,
        items: { create: lineItems },
      },
    });

    if (s.status === "COMPLETED") {
      await prisma.financialTransaction.create({
        data: {
          description:
            s.downPayment > 0
              ? `Entrada ${sale.code}`
              : `Venda ${sale.code}`,
          amount: s.downPayment > 0 ? s.downPayment : total,
          type: "INCOME",
          category: "Vendas",
          saleId: sale.id,
          date: createdAt,
        },
      });

      const completedAt =
        s.serviceStatus === "COMPLETED" ? new Date(createdAt) : null;
      if (s.serviceStatus === "COMPLETED" && completedAt) {
        completedAt.setDate(completedAt.getDate() + 3);
      }

      await prisma.serviceOrder.create({
        data: {
          code: s.code.replace("VND", "OS"),
          saleId: sale.id,
          customerId: customer.id,
          userId: s.userId,
          status: s.serviceStatus ?? "OPEN",
          startedById: s.startedById,
          completedById: s.completedById,
          completedAt,
          description: `Ordem de serviço gerada pela venda ${sale.code}`,
        },
      });
    }
  }

  console.log("✅ Seed concluído!");
  console.log(`   ${products.length} produtos · ${customers.length} clientes`);
  console.log(`   ${quotesData.length} orçamentos · ${salesData.length} vendas`);
  console.log("   Admin: jonathadelgado@gmail.com / ua042728");
  console.log("   Vendedor: vendedor@uniao.com / vendedor123");
  console.log("   Funcionário: funcionario@uniao.com / funcionario123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
