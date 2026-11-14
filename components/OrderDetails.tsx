import type { OrderRow } from "@/lib/orders";
import { formatSGD } from "@/lib/money";
import { PriceSummary } from "@/components/PriceSummary";

export function OrderLines({ order }: { order: OrderRow }) {
  return (
    <ul className="space-y-2">
      {order.order_items?.map((i) => (
        <li key={i.id} className="flex justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">
              {i.quantity}× {i.name}
            </p>
            {i.options.length > 0 && <p className="text-stone-500">{i.options.map((o) => o.name).join(", ")}</p>}
            {i.note && <p className="italic text-stone-500">“{i.note}”</p>}
          </div>
          <span className="shrink-0">{formatSGD(i.line_total_cents)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: OrderRow }) {
  return (
    <PriceSummary
      totals={{
        subtotalCents: order.subtotal_cents,
        serviceChargeCents: order.service_charge_cents,
        gstCents: order.gst_cents,
        totalCents: order.total_cents,
      }}
    />
  );
}

export function StatusBadge({ status }: { status: OrderRow["status"] }) {
  const styles = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-800",
  } as const;
  const label = { paid: "Paid", pending: "Not paid", failed: "Failed" }[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>{label}</span>;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
