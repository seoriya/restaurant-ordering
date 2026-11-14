import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import { centsToDecimalString, decimalToCents } from "@/lib/money";

// Talks to HitPay's Payment Request API. The API key never leaves the server.

type PaymentRequest = {
  id: string;
  url: string;
  status: string; // "pending" | "completed" | "failed" | "expired" ...
  amount: string | number;
  currency: string;
  reference_number?: string | null;
  payments?: { id: string; status: string; amount?: string | number }[];
};

function headers(extra: Record<string, string> = {}) {
  return {
    "X-BUSINESS-API-KEY": env.hitpayApiKey,
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    ...extra,
  };
}

export async function createPaymentRequest(args: {
  amountCents: number;
  referenceNumber: string;
  redirectUrl: string;
  webhookUrl?: string;
  name: string;
  phone: string;
  purpose: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    amount: centsToDecimalString(args.amountCents),
    currency: "SGD",
    reference_number: args.referenceNumber,
    redirect_url: args.redirectUrl,
    name: args.name,
    phone: args.phone,
    purpose: args.purpose,
    allow_repeated_payments: "false",
  });
  if (args.webhookUrl) body.set("webhook", args.webhookUrl);

  const res = await fetch(`${env.hitpayApiBase}/v1/payment-requests`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/x-www-form-urlencoded" }),
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as PaymentRequest | null;
  if (!res.ok || !json?.id || !json?.url) {
    console.error("HitPay create payment request failed", res.status, json);
    throw new Error("Could not start the payment with HitPay. Please try again.");
  }
  return { id: json.id, url: json.url };
}

export async function getPaymentRequest(id: string): Promise<PaymentRequest> {
  const res = await fetch(`${env.hitpayApiBase}/v1/payment-requests/${encodeURIComponent(id)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HitPay lookup failed (${res.status})`);
  return (await res.json()) as PaymentRequest;
}

/**
 * Asks HitPay directly whether this payment request was paid in full.
 * This is the ONLY thing that can mark an order as paid.
 */
export async function verifyPaid(
  paymentRequestId: string,
  expectedCents: number,
  expectedReference: string
): Promise<{ paid: boolean; paymentId?: string }> {
  const pr = await getPaymentRequest(paymentRequestId);
  const succeeded = pr.payments?.find((p) => p.status === "succeeded");
  const paid =
    pr.status === "completed" &&
    pr.currency?.toUpperCase() === "SGD" &&
    decimalToCents(pr.amount) === expectedCents &&
    (!pr.reference_number || pr.reference_number === expectedReference);
  if (!paid) {
    console.info("HitPay says not paid yet", {
      paymentRequestId,
      status: pr.status,
      amount: pr.amount,
      currency: pr.currency,
      referenceMatches: pr.reference_number === expectedReference,
      payments: pr.payments?.map((p) => ({ status: p.status, amount: p.amount })),
    });
  }
  return { paid, paymentId: succeeded?.id };
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && ba.length > 0 && crypto.timingSafeEqual(ba, bb);
}

/** Older HitPay webhooks (form data + "hmac" field). */
export function verifyFormWebhook(fields: Record<string, string>): boolean {
  const { hmac, ...rest } = fields;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}${rest[k]}`)
    .join("");
  const expected = crypto.createHmac("sha256", env.hitpaySalt).update(message).digest("hex");
  return safeEqualHex(expected, hmac);
}

/** Newer HitPay webhooks (JSON body + "Hitpay-Signature" header). */
export function verifyJsonWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", env.hitpaySalt).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
