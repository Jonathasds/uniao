import type {
  Customer,
  Product,
  Sale,
  SaleItem,
  Quote,
  QuoteItem,
  Category,
  StockMovement,
  User,
  CompanySettings,
  ServiceOrder,
} from "@prisma/client";

export type SerializedProduct = Omit<Product, "salePrice"> & {
  salePrice: number;
};

export type ProductWithCategory = SerializedProduct & { category: Category };

export type SaleWithRelations = Omit<
  Sale,
  "subtotal" | "discount" | "downPayment" | "total"
> & {
  subtotal: number;
  discount: number;
  downPayment: number;
  total: number;
  customer: Customer;
  user: Pick<User, "id" | "name" | "role">;
  items: (Omit<SaleItem, "unitPrice" | "total"> & {
    unitPrice: number;
    total: number;
    product: SerializedProduct;
  })[];
};

export type QuoteWithRelations = Omit<Quote, "subtotal" | "discount" | "total"> & {
  subtotal: number;
  discount: number;
  total: number;
  customer: Customer;
  user: Pick<User, "id" | "name" | "role">;
  items: (Omit<QuoteItem, "unitPrice" | "total"> & {
    unitPrice: number;
    total: number;
    product: SerializedProduct;
  })[];
};

export type CustomerWithStats = Customer & {
  _count: { sales: number };
  sales: Pick<Sale, "id" | "total" | "createdAt" | "status">[];
};

export type StockMovementWithProduct = StockMovement & {
  product: SerializedProduct;
  user: Pick<User, "id" | "name">;
};

export type CompanySettingsClient = Omit<CompanySettings, "taxRate"> & {
  taxRate: number;
};

export type ServiceOrderUserAttribution = Pick<User, "id" | "name" | "role">;

export type ServiceOrderWithRelations = ServiceOrder & {
  customer: Customer;
  user: ServiceOrderUserAttribution;
  startedBy: ServiceOrderUserAttribution | null;
  completedBy: ServiceOrderUserAttribution | null;
  sale: SaleWithRelations;
};

export type DashboardStats = {
  monthlySales: number;
  previousMonthSales: number;
  openOrders: number;
  pendingQuotes: number;
  openServiceOrders: number;
  totalCustomers: number;
  chartYear: number;
  chartMonth: number;
  chartPreviousYear: number;
  chartMinYear: number;
  chartMaxYear: number;
  monthlySalesComparison: {
    month: string;
    previousMonth: string;
    monthFull: string;
    total: number;
    previousTotal: number;
  };
  recentSales: SaleWithRelations[];
};
