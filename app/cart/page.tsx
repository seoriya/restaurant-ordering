"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useQuote } from "@/components/useQuote";
import { PriceSummary } from "@/components/PriceSummary";
import { formatSGD } from "@/lib/money";

export default function CartPage() {
  const cart = useCart();
  const { quote, error, loading } = useQuote(cart.lines, cart.ready);

  if (!cart.ready) return null;

  if (cart.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand-600">
          ← Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-bold">Your cart</h1>

      <ul className="divide-y divide-stone-100 rounded-2xl bg-white ring-1 ring-stone-200">
        {cart.lines.map((l, i) => (
          <li key={l.key} className="flex gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l.name}</p>
              {l.optionNames.length > 0 && <p className="text-sm text-stone-500">{l.optionNames.join(", ")}</p>}
              {l.note && <p className="text-sm italic text-stone-500">“{l.note}”</p>}
              <p className="mt-1 text-sm font-semibold">
                {formatSGD(quote?.lines[i]?.lineTotalCents ?? l.previewUnitCents * l.quantity)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cart.setQuantity(l.key, l.quantity - 1)}
                className="h-9 w-9 rounded-full border border-stone-300 text-lg"
                aria-label={l.quantity === 1 ? "Remove" : "Less"}
              >
                {l.quantity === 1 ? "🗑" : "−"}
              </button>
              <span className="w-6 text-center font-semibold">{l.quantity}</span>
              <button
                onClick={() => cart.setQuantity(l.key, l.quantity + 1)}
                className="h-9 w-9 rounded-full border border-stone-300 text-lg"
                aria-label="More"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/" className="inline-block text-sm font-semibold text-brand-600">
        + Add more items
      </Link>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : quote ? (
          <PriceSummary totals={quote.totals} />
        ) : (
          <p className="text-sm text-stone-500">{loading ? "Calculating…" : ""}</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 p-4">
        <Link
          href="/checkout"
          aria-disabled={!quote}
          className={`mx-auto block max-w-xl rounded-2xl py-4 text-center font-semibold text-white shadow-lg ${
            quote ? "bg-brand-600" : "pointer-events-none bg-stone-300"
          }`}
        >
          Checkout {quote && `· ${formatSGD(quote.totals.totalCents)}`}
        </Link>
      </div>
    </div>
  );
}
