"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/types";
import type { CartLine } from "@/components/CartProvider";

/** Asks the server to price the cart whenever it changes. */
export function useQuote(lines: CartLine[], ready: boolean) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payload = JSON.stringify(
    lines.map((l) => ({ menuItemId: l.menuItemId, optionIds: l.optionIds, quantity: l.quantity, note: l.note }))
  );

  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setQuote(null);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: JSON.parse(payload) }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Could not price your cart.");
        setQuote(json);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setQuote(null);
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, ready]);

  return { quote, error, loading };
}
