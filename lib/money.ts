/** 1234 -> "$12.34" */
export function formatSGD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** 1234 -> "12.34" (the format HitPay expects) */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** "12.34" or 12.34 -> 1234 */
export function decimalToCents(value: string | number): number {
  return Math.round(Number(value) * 100);
}
