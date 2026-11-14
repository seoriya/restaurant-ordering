import { describe, expect, it } from "vitest";
import { computeTotals, indexMenu, priceCart, PricingError } from "@/lib/pricing";
import type { MenuCategory } from "@/lib/types";

const menu: MenuCategory[] = [
  {
    id: 1,
    name: "Mains",
    items: [
      {
        id: 1, name: "Chicken Rice", description: "", price_cents: 650, image_url: null, available: true,
        option_groups: [
          { id: 1, name: "Size", min_select: 1, max_select: 1, options: [
            { id: 1, name: "Regular", price_cents: 0 }, { id: 2, name: "Large", price_cents: 150 } ] },
          { id: 2, name: "Add-ons", min_select: 0, max_select: 3, options: [
            { id: 3, name: "Extra egg", price_cents: 100 } ] },
        ],
      },
      { id: 2, name: "Sold Out Laksa", description: "", price_cents: 750, image_url: null, available: false, option_groups: [] },
      { id: 3, name: "Kopi", description: "", price_cents: 200, image_url: null, available: true, option_groups: [] },
    ],
  },
];
const idx = indexMenu(menu);

describe("computeTotals", () => {
  it("adds 10% service charge then 9% GST on top", () => {
    expect(computeTotals(1000)).toEqual({ subtotalCents: 1000, serviceChargeCents: 100, gstCents: 99, totalCents: 1199 });
  });
  it("rounds to the cent", () => {
    // 1235 -> service 123.5 -> 124 ; GST (1235+124)*0.09 = 122.31 -> 122
    expect(computeTotals(1235)).toEqual({ subtotalCents: 1235, serviceChargeCents: 124, gstCents: 122, totalCents: 1481 });
  });
});

describe("priceCart", () => {
  it("uses menu prices and option prices", () => {
    const q = priceCart(idx, [{ menuItemId: 1, optionIds: [2, 3], quantity: 2, note: " no cucumber " }]);
    expect(q.lines[0].unitPriceCents).toBe(650 + 150 + 100);
    expect(q.lines[0].lineTotalCents).toBe(1800);
    expect(q.lines[0].note).toBe("no cucumber");
    expect(q.totals.subtotalCents).toBe(1800);
  });

  it("ignores any price sent from the phone", () => {
    const q = priceCart(idx, [{ menuItemId: 3, optionIds: [], quantity: 1, price_cents: 1, unitPriceCents: 1 } as never]);
    expect(q.lines[0].unitPriceCents).toBe(200);
  });

  it("rejects missing required choice", () => {
    expect(() => priceCart(idx, [{ menuItemId: 1, optionIds: [], quantity: 1 }])).toThrow(PricingError);
  });
  it("rejects two sizes", () => {
    expect(() => priceCart(idx, [{ menuItemId: 1, optionIds: [1, 2], quantity: 1 }])).toThrow(PricingError);
  });
  it("rejects options from another dish", () => {
    expect(() => priceCart(idx, [{ menuItemId: 3, optionIds: [3], quantity: 1 }])).toThrow(PricingError);
  });
  it("rejects sold out, unknown items, bad quantities and empty carts", () => {
    expect(() => priceCart(idx, [{ menuItemId: 2, optionIds: [], quantity: 1 }])).toThrow(PricingError);
    expect(() => priceCart(idx, [{ menuItemId: 99, optionIds: [], quantity: 1 }])).toThrow(PricingError);
    expect(() => priceCart(idx, [{ menuItemId: 3, optionIds: [], quantity: 0 }])).toThrow(PricingError);
    expect(() => priceCart(idx, [{ menuItemId: 3, optionIds: [], quantity: 1.5 }])).toThrow(PricingError);
    expect(() => priceCart(idx, [{ menuItemId: 3, optionIds: [], quantity: -2 }])).toThrow(PricingError);
    expect(() => priceCart(idx, [])).toThrow(PricingError);
  });
});
