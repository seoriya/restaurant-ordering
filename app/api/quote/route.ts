import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menu";
import { indexMenu, priceCart, PricingError } from "@/lib/pricing";

// Prices a cart on the server. The phone only sends item IDs, option IDs and quantities.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const quote = priceCart(indexMenu(await getMenu()), body?.lines);
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof PricingError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
