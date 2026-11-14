// Shapes shared between server and browser. No secrets in here.

export type MenuOption = { id: number; name: string; price_cents: number };

export type MenuOptionGroup = {
  id: number;
  name: string;
  min_select: number;
  max_select: number;
  options: MenuOption[];
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  available: boolean;
  option_groups: MenuOptionGroup[];
};

export type MenuCategory = { id: number; name: string; items: MenuItem[] };

/** What the phone is allowed to send: IDs and quantities only — never prices. */
export type CartLineInput = {
  menuItemId: number;
  optionIds: number[];
  quantity: number;
  note?: string;
};

export type PricedLine = {
  menuItemId: number;
  name: string;
  quantity: number;
  options: { id: number; name: string; price_cents: number }[];
  note: string;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type Totals = {
  subtotalCents: number;
  serviceChargeCents: number;
  gstCents: number;
  totalCents: number;
};

export type Quote = { lines: PricedLine[]; totals: Totals };
