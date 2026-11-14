"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

/** Empties the cart once the order is paid; otherwise re-checks the payment a few times. */
export function AfterPayment({ orderId, paid }: { orderId: string; paid: boolean }) {
  const { ready, clearAfterPaid } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (paid && ready) clearAfterPaid(orderId);
  }, [paid, ready, orderId, clearAfterPaid]);

  useEffect(() => {
    if (paid) return;
    const key = `recheck-${orderId}`;
    const tries = Number(sessionStorage.getItem(key) ?? 0);
    if (tries >= 5) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(key, String(tries + 1));
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [paid, orderId, router]);

  return null;
}
