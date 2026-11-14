import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmPaymentWithHitPay, getOrder } from "@/lib/orders";
import { UUID_RE } from "@/lib/validate";
import { OrderLines, OrderTotals, formatTime } from "@/components/OrderDetails";
import { AfterPayment } from "@/components/AfterPayment";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  let order = await getOrder(id);
  if (!order) notFound();

  // Customer just came back from HitPay: ask HitPay directly whether it's really paid.
  let checkFailed = false;
  if (order.status === "pending") {
    try {
      const status = await confirmPaymentWithHitPay(order);
      if (status === "paid") order = (await getOrder(id))!;
    } catch (e) {
      console.error(e);
      checkFailed = true;
    }
  }

  const paid = order.status === "paid";

  return (
    <div className="space-y-5 py-6">
      <AfterPayment orderId={order.id} paid={paid} />

      {paid ? (
        <div className="rounded-2xl bg-green-50 p-6 text-center ring-1 ring-green-200">
          <div className="text-5xl">✅</div>
          <h1 className="mt-2 text-2xl font-bold text-green-800">Order paid</h1>
          <p className="text-green-800">Thank you, {order.customer_name}! Your food is on its way to table {order.table_number}.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50 p-6 text-center ring-1 ring-amber-200">
          <div className="text-5xl">⏳</div>
          <h1 className="mt-2 text-2xl font-bold text-amber-900">Payment not confirmed yet</h1>
          <p className="text-sm text-amber-900">
            {checkFailed
              ? "We couldn't reach HitPay to check your payment. Please tap “Check again”."
              : "If you just paid, this can take a few seconds. This page checks again automatically."}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={`/order/${order.id}`} className="rounded-xl bg-white py-3 font-semibold ring-1 ring-amber-300">
              Check again
            </Link>
            {order.hitpay_url && (
              <a href={order.hitpay_url} className="rounded-xl bg-brand-600 py-3 font-semibold text-white">
                Pay now
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <div className="flex justify-between text-sm text-stone-500">
          <span>Order #{order.order_number} · Table {order.table_number}</span>
          <span>{formatTime(order.paid_at ?? order.created_at)}</span>
        </div>
        <OrderLines order={order} />
        <div className="border-t border-stone-200 pt-3">
          <OrderTotals order={order} />
        </div>
      </div>

      <div className="flex justify-between text-sm font-semibold text-brand-600">
        <Link href="/">← Back to menu</Link>
        <Link href="/orders">My orders →</Link>
      </div>
    </div>
  );
}
