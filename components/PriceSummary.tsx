import { formatSGD } from "@/lib/money";
import type { Totals } from "@/lib/types";

export function PriceSummary({ totals }: { totals: Totals }) {
  return (
    <dl className="space-y-1 text-sm">
      <Row label="Subtotal" value={totals.subtotalCents} />
      <Row label="Service charge (10%)" value={totals.serviceChargeCents} />
      <Row label="GST (9%)" value={totals.gstCents} />
      <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
        <dt>Total</dt>
        <dd>{formatSGD(totals.totalCents)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-stone-600">
      <dt>{label}</dt>
      <dd>{formatSGD(value)}</dd>
    </div>
  );
}
