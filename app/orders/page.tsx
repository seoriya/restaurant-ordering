import Link from "next/link";
import { readDeviceId } from "@/lib/device";
import { listOrdersForDevice } from "@/lib/orders";
import { formatSGD } from "@/lib/money";
import { StatusBadge, formatTime } from "@/components/OrderDetails";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const deviceId = await readDeviceId();
  const orders = deviceId ? await listOrdersForDevice(deviceId) : [];

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      <p className="text-sm text-stone-500">Orders placed from this phone.</p>

      {orders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-semibold">No orders yet</p>
          <Link href="/" className="mt-3 inline-block font-semibold text-brand-600">Browse the menu →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/order/${o.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Order #{o.order_number}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                  {o.order_items?.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">{formatTime(o.created_at)} · Table {o.table_number}</span>
                  <span className="font-semibold">{formatSGD(o.total_cents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
