# Kopi & Co — table ordering

Customers scan a QR code at their table, order from their phone and pay with HitPay.

## How it works
- **Menu, orders**: stored in Supabase. The menu is public (read-only). Orders are only readable by the server.
- **Prices**: always worked out on the server (`lib/pricing.ts`): subtotal → +10% service charge → +9% GST on top.
- **Paid**: an order is only marked paid after the server asks HitPay's API directly (`lib/orders.ts → confirmPaymentWithHitPay`).
  This runs when the customer returns from HitPay and when HitPay's webhook arrives.
- **Double taps**: each checkout gets a one-time ticket (`idempotency_key`). The database allows one order per ticket.
- **My orders**: an anonymous random ID cookie on the phone. No login.
- **Secrets**: only in `.env.local` / Vercel settings, only read in `server-only` files.

## Pages
`/` menu (`/?table=5` from QR) · `/cart` · `/checkout` · `/order/[id]` · `/orders` · `/staff` · `/staff/qr`

## Run on your computer
1. Copy `.env.example` to `.env.local` and fill in the values.
2. `npm install`
3. `npm run dev` → open http://localhost:3000

## Database
SQL files in `supabase/migrations/` — `001_init.sql` (tables, security, `create_order`) and `002_seed_menu.sql` (sample menu).
To change the menu, edit the tables in Supabase → Table Editor (`menu_items`, `option_groups`, `options`).

## Going live
Deploy on Vercel, add the same environment variables (with `APP_URL` = your Vercel address), and reprint the QR codes from `/staff/qr`.
For real payments, switch `HITPAY_API_BASE` to `https://api.hit-pay.com` and use your live HitPay keys.

## Tests
`npm test` — pricing maths and tamper checks.
