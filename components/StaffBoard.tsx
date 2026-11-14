"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderRow } from "@/lib/orders";
import { formatSGD } from "@/lib/money";

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-SG", { timeZone: "Asia/Singapore", hour: "numeric", minute: "2-digit" });
}

export function StaffBoard() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/orders${showDone ? "?done=1" : ""}`, { cache: "no-store" });
      if (res.status === 401) return window.location.reload();
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrders(json.orders);
      setError(null);
    } catch {
      setError("Couldn't refresh orders. Retrying…");
    }
  }, [showDone]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function markDone(id: string) {
    setOrders((cur) => cur?.map((o) => (o.id === id ? { ...o, done_at: new Date().toISOString() } : o)) ?? null);
    await fetch(`/api/staff/orders/${id}/done`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-brand-600" />
        Show completed orders
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {orders === null ? (
        <p className="text-stone-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-stone-500">No orders waiting. This page refreshes every 15 seconds.</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className={`rounded-2xl bg-white p-4 ring-1 ring-stone-200 ${o.done_at ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold">Table {o.table_number}</p>
                <p className="text-sm text-stone-500">
                  #{o.order_number} · {o.customer_name} · {o.phone} · paid {o.paid_at && time(o.paid_at)}
                </p>
              </div>
              <span className="font-semibold">{formatSGD(o.total_cents)}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {o.order_items?.map((i) => (
                <li key={i.id}>
                  <span className="font-semibold">{i.quantity}× {i.name}</span>
                  {i.options.length > 0 && <span className="text-stone-600"> — {i.options.map((x) => x.name).join(", ")}</span>}
                  {i.note && <span className="block text-sm italic text-brand-700">Note: {i.note}</span>}
                </li>
              ))}
            </ul>
            {!o.done_at && (
              <button onClick={() => markDone(o.id)} className="mt-3 w-full rounded-xl bg-green-700 py-2.5 font-semibold text-white">
                Mark done
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
