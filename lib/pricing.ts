// The ONE place prices are worked out. Used by the quote, checkout and the tests.
// It only trusts prices from the menu (database), never from the phone.
import type { CartLineInput, MenuCategory, MenuItem, PricedLine, Quote, Totals } from "./types";

export const SERVICE_CHARGE_RATE_PERCENT = 10;
export const GST_RATE_PERCENT = 9;
export const MAX_QUANTITY = 20;
export const MAX_LINES = 30;
export const MAX_NOTE_LENGTH = 200;

export class PricingError extends Error {}

/** subtotal -> +10% service charge -> +9% GST on (subtotal + service). Rounded to the cent at each step. */
export function computeTotals(subtotalCents: number): Totals {
  const serviceChargeCents = Math.round((subtotalCents * SERVICE_CHARGE_RATE_PERCENT) / 100);
  const gstCents = Math.round(((subtotalCents + serviceChargeCents) * GST_RATE_PERCENT) / 100);
  return {
    subtotalCents,
    serviceChargeCents,
    gstCents,
    totalCents: subtotalCents + serviceChargeCents + gstCents,
  };
}

export function indexMenu(menu: MenuCategory[]): Map<number, MenuItem> {
  const map = new Map<number, MenuItem>();
  for (const cat of menu) for (const item of cat.items) map.set(item.id, item);
  return map;
}

export function priceCart(menu: Map<number, MenuItem>, lines: unknown): Quote {
  if (!Array.isArray(lines) || lines.length === 0) throw new PricingError("Your cart is empty.");
  if (lines.length > MAX_LINES) throw new PricingError("Too many items in the cart.");

  const priced: PricedLine[] = lines.map((raw) => priceLine(menu, raw as CartLineInput));
  const subtotal = priced.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return { lines: priced, totals: computeTotals(subtotal) };
}

function priceLine(menu: Map<number, MenuItem>, line: CartLineInput): PricedLine {
  if (!line || typeof line !== "object") throw new PricingError("Invalid cart item.");

  const item = menu.get(Number(line.menuItemId));
  if (!item) throw new PricingError("An item in your cart is no longer on the menu.");
  if (!item.available) throw new PricingError(`${item.name} is sold out.`);

  const quantity = Number(line.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new PricingError(`Quantity for ${item.name} must be between 1 and ${MAX_QUANTITY}.`);
  }

  const note = typeof line.note === "string" ? line.note.trim() : "";
  if (note.length > MAX_NOTE_LENGTH) throw new PricingError("Note is too long.");

  const optionIds = Array.isArray(line.optionIds) ? line.optionIds.map(Number) : [];
  if (new Set(optionIds).size !== optionIds.length) throw new PricingError("Duplicate option selected.");

  // Every chosen option must belong to THIS dish, and each group's min/max must be respected.
  const chosen: PricedLine["options"] = [];
  const seen = new Set<number>();
  for (const group of item.option_groups) {
    const picked = group.options.filter((o) => optionIds.includes(o.id));
    if (picked.length < group.min_select) throw new PricingError(`Please choose ${group.name} for ${item.name}.`);
    if (picked.length > group.max_select) throw new PricingError(`Too many ${group.name} choices for ${item.name}.`);
    for (const o of picked) {
      chosen.push({ id: o.id, name: o.name, price_cents: o.price_cents });
      seen.add(o.id);
    }
  }
  if (seen.size !== optionIds.length) throw new PricingError(`Invalid option for ${item.name}.`);

  const unitPriceCents = item.price_cents + chosen.reduce((s, o) => s + o.price_cents, 0);
  return {
    menuItemId: item.id,
    name: item.name,
    quantity,
    options: chosen,
    note,
    unitPriceCents,
    lineTotalCents: unitPriceCents * quantity,
  };
}
