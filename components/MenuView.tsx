"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { formatSGD } from "@/lib/money";
import { useCart } from "@/components/CartProvider";
import { DishSheet } from "@/components/DishSheet";
import { DishImage } from "@/components/DishImage";

export function MenuView({ menu, tableFromQr }: { menu: MenuCategory[]; tableFromQr: string | null }) {
  const cart = useCart();
  const [open, setOpen] = useState<MenuItem | null>(null);
  const { setTable, ready } = cart;

  // Remember the table from the QR code (after the saved cart has loaded).
  useEffect(() => {
    if (ready && tableFromQr) setTable(tableFromQr);
  }, [ready, tableFromQr, setTable]);

  return (
    <>
      <div className="py-4">
        <h1 className="text-2xl font-bold">Menu</h1>
        {cart.table && <p className="text-sm text-stone-500">Ordering for table {cart.table}</p>}
      </div>

      <nav className="sticky top-[53px] z-20 -mx-4 mb-2 flex gap-2 overflow-x-auto bg-[#faf7f2] px-4 py-2">
        {menu.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="shrink-0 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium"
          >
            {c.name}
          </a>
        ))}
      </nav>

      {menu.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-28 pt-4">
          <h2 className="mb-3 text-xl font-bold">{c.name}</h2>
          <ul className="space-y-3">
            {c.items.map((item) => (
              <li key={item.id}>
                <button
                  disabled={!item.available}
                  onClick={() => setOpen(item)}
                  className="flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-200 transition active:scale-[0.99] disabled:opacity-50"
                >
                  <DishImage src={item.image_url} alt={item.name} className="h-24 w-24 shrink-0 rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{item.name}</span>
                    <span className="line-clamp-2 text-sm text-stone-500">{item.description}</span>
                    <span className="mt-auto pt-1 font-semibold text-brand-600">
                      {item.available ? formatSGD(item.price_cents) : "Sold out"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {open && <DishSheet item={open} onClose={() => setOpen(null)} />}

      {cart.ready && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <Link
            href="/cart"
            className="mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white shadow-lg"
          >
            <span>View cart · {cart.count} item{cart.count > 1 ? "s" : ""}</span>
            <span>{formatSGD(cart.previewTotalCents)}</span>
          </Link>
        </div>
      )}
    </>
  );
}
