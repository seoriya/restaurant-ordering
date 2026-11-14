import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menu";
import { indexMenu, priceCart, PricingError } from "@/lib/pricing";
import { getOrCreateDeviceId, readDeviceId, setDeviceId } from "@/lib/device";
import { normalizeName, normalizeSgPhone, normalizeTable, UUID_RE } from "@/lib/validate";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrderByIdempotencyKey, type OrderRow } from "@/lib/orders";
import { createPaymentRequest } from "@/lib/hitpay";
import { env } from "@/lib/env";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  // Did this phone already have its anonymous ID before this request?
  const hadDeviceId = await readDeviceId();

  /** What to tell the phone for an order (also used after a double tap). */
  async function responseFor(order: OrderRow) {
    const redirectUrl = order.status === "paid" ? `/order/${order.id}` : order.hitpay_url;
    if (!redirectUrl) return null;
    // Two taps from a brand-new phone could each invent a different ID at the same moment.
    // Make sure the phone ends up with the ID the order was actually saved under ("My orders").
    if (!hadDeviceId && order.device_id) await setDeviceId(order.device_id);
    return NextResponse.json({ orderId: order.id, redirectUrl });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) return bad("Invalid request.");

    const idempotencyKey = String(body.idempotencyKey ?? "");
    if (!UUID_RE.test(idempotencyKey)) return bad("Invalid checkout. Please refresh and try again.");

    const name = normalizeName(String(body.name ?? ""));
    const phone = normalizeSgPhone(String(body.phone ?? ""));
    const table = normalizeTable(String(body.table ?? ""));
    if (!name) return bad("Please enter your name.");
    if (!phone) return bad("Please enter a valid Singapore phone number (8 digits).");
    if (!table) return bad("Please enter your table number.");

    // 1) Same checkout ticket seen before? Return the same order — never create a second one.
    const existing = await getOrderByIdempotencyKey(idempotencyKey);
    if (existing) {
      const r = await responseFor(existing);
      if (r) return r;
    }

    // 2) Work out prices on the server from the database menu.
    const quote = priceCart(indexMenu(await getMenu()), body.lines);
    const deviceId = await getOrCreateDeviceId();
    const db = supabaseAdmin();

    // 3) Save order + items in one step. The database refuses a duplicate ticket.
    const { data, error } = await db.rpc("create_order", {
      p_order: {
        idempotency_key: idempotencyKey,
        device_id: deviceId,
        customer_name: name,
        phone,
        table_number: table,
        subtotal_cents: quote.totals.subtotalCents,
        service_charge_cents: quote.totals.serviceChargeCents,
        gst_cents: quote.totals.gstCents,
        total_cents: quote.totals.totalCents,
      },
      p_items: quote.lines.map((l) => ({
        menu_item_id: l.menuItemId,
        name: l.name,
        quantity: l.quantity,
        unit_price_cents: l.unitPriceCents,
        line_total_cents: l.lineTotalCents,
        options: l.options,
        note: l.note,
      })),
    });
    if (error) throw new Error(error.message);
    const { order_id: orderId, created } = (data as { order_id: string; created: boolean }[])[0];

    if (!created) {
      // Another tap is creating the payment right now — wait briefly for it.
      for (let i = 0; i < 10; i++) {
        const o = await getOrderByIdempotencyKey(idempotencyKey);
        const r = o && (await responseFor(o));
        if (r) return r;
        await new Promise((res) => setTimeout(res, 500));
      }
      // Still no payment link (e.g. HitPay was down last time): carry on and create it below.
    }

    // 4) Ask HitPay for a payment page, using the amounts SAVED on the order.
    const order = await getOrderByIdempotencyKey(idempotencyKey);
    if (!order) throw new Error("Order vanished");
    const appUrl = env.appUrl;
    const payment = await createPaymentRequest({
      amountCents: order.total_cents,
      referenceNumber: orderId,
      redirectUrl: `${appUrl}/order/${orderId}`,
      // HitPay can only call public https addresses, so the webhook is skipped on localhost.
      webhookUrl: appUrl.startsWith("https://") ? `${appUrl}/api/hitpay/webhook` : undefined,
      name: order.customer_name,
      phone: order.phone,
      purpose: `Table ${order.table_number} order #${order.order_number}`,
    });

    // Only the first payment link is kept, even if two taps got here at the same moment.
    const { error: upErr } = await db
      .from("orders")
      .update({ hitpay_payment_request_id: payment.id, hitpay_url: payment.url })
      .eq("id", orderId)
      .is("hitpay_payment_request_id", null);
    if (upErr) throw new Error(upErr.message);

    const saved = await getOrderByIdempotencyKey(idempotencyKey);
    return (await responseFor(saved!)) ?? NextResponse.json({ orderId, redirectUrl: payment.url });
  } catch (e) {
    if (e instanceof PricingError) return bad(e.message);
    console.error(e);
    return bad(e instanceof Error && e.message.includes("HitPay") ? e.message : "Something went wrong. Please try again.", 500);
  }
}
