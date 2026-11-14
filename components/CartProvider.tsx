"use client";

import { uuid } from "@/lib/uuid";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// The cart lives in the phone's browser storage. Prices shown here are only a preview —
// the real prices are always worked out again on the server.

export type CartLine = {
  key: string;
  menuItemId: number;
  optionIds: number[];
  quantity: number;
  note: string;
  name: string;
  optionNames: string[];
  previewUnitCents: number;
};

type CartState = {
  lines: CartLine[];
  table: string;
  checkoutKey: string | null; // one-time "checkout ticket" — stops double orders
  lastOrderId: string | null;
};

type CartApi = CartState & {
  ready: boolean;
  count: number;
  previewTotalCents: number;
  addLine: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  setTable: (table: string) => void;
  getCheckoutKey: () => string;
  setLastOrderId: (id: string) => void;
  clearAfterPaid: (orderId: string) => void;
};

const STORAGE_KEY = "cart-v1";
const empty: CartState = { lines: [], table: "", checkoutKey: null, lastOrderId: null };
const CartContext = createContext<CartApi | null>(null);

function sameChoice(a: Omit<CartLine, "key">, b: CartLine) {
  return (
    a.menuItemId === b.menuItemId &&
    a.note === b.note &&
    a.optionIds.length === b.optionIds.length &&
    [...a.optionIds].sort().every((id, i) => id === [...b.optionIds].sort()[i])
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...empty, ...JSON.parse(saved) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  // Any change to the cart contents = a new checkout ticket next time.
  const changeLines = useCallback((fn: (lines: CartLine[]) => CartLine[]) => {
    setState((s) => ({ ...s, lines: fn(s.lines), checkoutKey: null }));
  }, []);

  const setTable = useCallback(
    (table: string) => setState((s) => (s.table === table ? s : { ...s, table })),
    []
  );

  const api = useMemo<CartApi>(
    () => ({
      ...state,
      ready,
      count: state.lines.reduce((n, l) => n + l.quantity, 0),
      previewTotalCents: state.lines.reduce((n, l) => n + l.previewUnitCents * l.quantity, 0),
      addLine: (line) =>
        changeLines((lines) => {
          const match = lines.find((l) => sameChoice(line, l));
          if (match) {
            return lines.map((l) =>
              l === match ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l
            );
          }
          return [...lines, { ...line, key: uuid() }];
        }),
      setQuantity: (key, quantity) =>
        changeLines((lines) =>
          quantity <= 0
            ? lines.filter((l) => l.key !== key)
            : lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l))
        ),
      removeLine: (key) => changeLines((lines) => lines.filter((l) => l.key !== key)),
      setTable,
      getCheckoutKey: () => {
        if (state.checkoutKey) return state.checkoutKey;
        const key = uuid();
        setState((s) => ({ ...s, checkoutKey: key }));
        return key;
      },
      setLastOrderId: (id) => setState((s) => ({ ...s, lastOrderId: id })),
      clearAfterPaid: (orderId) =>
        setState((s) => (s.lastOrderId === orderId ? { ...empty, table: s.table } : s)),
    }),
    [state, ready, changeLines, setTable]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
