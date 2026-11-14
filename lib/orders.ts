import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPaid } from "@/lib/hitpay";

export type OrderItemRow = {
  id: number;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  options: { id: number; name: string; price_cents: number }[];
  note: string;
};

export type OrderRow = {
  id: string;
  device_id?: string;
  order_number: number;
  customer_name: string;
  phone: string;
  table_number: string;
  subtotal_cents: number;
  service_charge_cents: number;
  gst_cents: number;
  total_cents: number;
  status: "pending" | "paid" | "failed";
  hitpay_payment_request_id: string | null;
  hitpay_url: string | null;
  paid_at: string | null;
  done_at: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

const ORDER_COLS =
  "id, order_number, customer_name, phone, table_number, subtotal_cents, service_charge_cents, gst_cents, total_cents, status, hitpay_payment_request_id, hitpay_url, paid_at, done_at, created_at";
const WITH_ITEMS = `${ORDER_COLS}, order_items(id, name, quantity, unit_price_cents, line_total_cents, options, note)`;

export async function getOrder(id: string): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin().from("orders").select(WITH_ITEMS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) (data as OrderRow).order_items?.sort((a, b) => a.id - b.id);
  return data as OrderRow | null;
}

export async function getOrderByIdempotencyKey(key: string): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(`${ORDER_COLS}, device_id`)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as OrderRow | null;
}

export async function listOrdersForDevice(deviceId: string): Promise<OrderRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(WITH_ITEMS)
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data as OrderRow[];
}

export async function listPaidOrders(includeDone: boolean): Promise<OrderRow[]> {
  let q = supabaseAdmin().from("orders").select(WITH_ITEMS).eq("status", "paid");
  if (!includeDone) q = q.is("done_at", null);
  const { data, error } = await q.order("paid_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data as OrderRow[];
}

/**
 * Checks with HitPay and, ONLY if HitPay confirms full payment, marks the order paid.
 * Safe to call many times (from the return page and from the webhook).
 */
export async function confirmPaymentWithHitPay(order: OrderRow): Promise<OrderRow["status"]> {
  if (order.status === "paid") return "paid";
  if (!order.hitpay_payment_request_id) return order.status;

  const { paid, paymentId } = await verifyPaid(order.hitpay_payment_request_id, order.total_cents, order.id);
  if (!paid) return order.status;

  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), hitpay_payment_id: paymentId ?? null })
    .eq("id", order.id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return "paid";
}
