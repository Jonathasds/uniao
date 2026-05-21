"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * Abas de navegação para seções da página.
 */
export const Tabs = TabsPrimitive.Root;

/**
 * Lista de gatilhos das abas.
 */
export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-lg bg-slate-100 p-1",
        className
      )}
      {...props}
    />
  );
}

/**
 * Botão de uma aba.
 */
export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors",
        "hover:text-slate-900",
        "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * Painel de conteúdo de uma aba.
 */
export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}
