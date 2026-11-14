"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useQuote } from "@/components/useQuote";
import { PriceSummary } from "@/components/PriceSummary";
import { formatSGD } from "@/lib/money";
import { normalizeName, normalizeSgPhone, normalizeTable } from "@/lib/validate";

const DETAILS_KEY = "customer-details-v1";

export default function CheckoutPage() {
  const cart = useCart();
  const { quote, error: quoteError } = useQuote(cart.lines, cart.ready);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [table, setTable] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // blocks a second tap even before React re-renders

  useEffect(() => {
    if (!cart.ready) return;
    setTable((t) => t || cart.table);
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "{}");
      setName((n) => n || saved.name || "");
      setPhone((p) => p || saved.phone || "");
    } catch {}
  }, [cart.ready, cart.table]);

  if (!cart.ready) return null;
  if (cart.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand-600">← Back to menu</Link>
      </div>
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    if (!normalizeName(name)) return setError("Please enter your name.");
    if (!normalizeSgPhone(phone)) return setError("Please enter a valid Singapore phone number (8 digits).");
    if (!normalizeTable(table)) return setError("Please enter your table number.");

    submittingRef.current = true;
    setSubmitting(true);
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify({ name, phone }));
    } catch {}
    cart.setTable(normalizeTable(table)!);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: cart.getCheckoutKey(),
          name,
          phone,
          table,
          lines: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            optionIds: l.optionIds,
            quantity: l.quantity,
            note: l.note,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment could not start.");
      cart.setLastOrderId(json.orderId);
      window.location.href = json.redirectUrl; // off to HitPay
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not start.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={pay} className="space-y-5 py-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" />
        <Field label="Phone number" value={phone} onChange={setPhone} type="tel" inputMode="tel" placeholder="9123 4567" autoComplete="tel" />
        <Field label="Table number" value={table} onChange={setTable} inputMode="text" placeholder="e.g. 12" />
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <ul className="mb-3 space-y-1 text-sm">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-2">
              <span>
                {l.quantity}× {l.name}
                {l.optionNames.length > 0 && <span className="text-stone-500"> ({l.optionNames.join(", ")})</span>}
              </span>
            </li>
          ))}
        </ul>
        {quoteError ? <p className="text-sm text-red-700">{quoteError}</p> : quote && <PriceSummary totals={quote.totals} />}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#faf7f2] p-4">
        <button
          type="submit"
          disabled={submitting || !quote}
          className="mx-auto block w-full max-w-xl rounded-2xl bg-brand-600 py-4 font-semibold text-white shadow-lg disabled:bg-stone-400"
        >
          {submitting ? "Taking you to HitPay…" : `Pay with HitPay${quote ? ` · ${formatSGD(quote.totals.totalCents)}` : ""}`}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
        required
        {...rest}
      />
    </label>
  );
}
