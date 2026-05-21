import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "União ERP | Gestão Comercial",
    template: "%s | União ERP",
  },
  description:
    "Sistema de gestão comercial e estoque. Controle vendas, produtos, clientes e orçamentos.",
  keywords: ["ERP", "gestão comercial", "estoque", "vendas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <AuthSessionProvider>
          {children}
          <ToastProvider />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
