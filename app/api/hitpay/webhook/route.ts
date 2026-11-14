import { NextResponse } from "next/server";
import { verifyFormWebhook, verifyJsonWebhook } from "@/lib/hitpay";
import { confirmPaymentWithHitPay, getOrder } from "@/lib/orders";
import { UUID_RE } from "@/lib/validate";

// HitPay calls this after a payment. We check the signature with our salt,
// then STILL ask HitPay's API directly before marking anything as paid.
export async function POST(req: Request) {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  let reference: string | undefined;
  if (contentType.includes("application/json")) {
    if (!verifyJsonWebhook(raw, req.headers.get("hitpay-signature"))) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
    const json = JSON.parse(raw);
    reference = json.reference_number ?? json.reference ?? json.payment_request?.reference_number;
  } else {
    const fields = Object.fromEntries(new URLSearchParams(raw));
    if (!verifyFormWebhook(fields)) return NextResponse.json({ error: "bad signature" }, { status: 401 });
    reference = fields.reference_number;
  }

  if (!reference || !UUID_RE.test(reference)) return NextResponse.json({ ok: true, ignored: true });

  try {
    const order = await getOrder(reference);
    if (!order) return NextResponse.json({ ok: true, ignored: true });
    const status = await confirmPaymentWithHitPay(order);
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("webhook error", e);
    return NextResponse.json({ error: "temporary error" }, { status: 500 }); // HitPay will retry
  }
}
