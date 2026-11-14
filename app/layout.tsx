import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

import { RESTAURANT_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `${RESTAURANT_NAME} · Order at your table`,
  description: "Scan, order and pay from your table.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9a3412",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <CartProvider>
          <header className="no-print sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-bold text-brand-600">
                ☕ {RESTAURANT_NAME}
              </Link>
              <Link href="/orders" className="text-sm font-medium text-stone-600 hover:text-brand-600">
                My orders
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-xl px-4 pb-32">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
