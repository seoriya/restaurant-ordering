import "server-only";

// Reads secret settings. "server-only" makes the build FAIL if this file is ever
// imported into code that runs on the customer's phone.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing setting ${name}. Add it to .env.local (or Vercel → Settings → Environment Variables).`);
  return value;
}

export const env = {
  get supabaseUrl() { return required("SUPABASE_URL"); },
  get supabasePublishableKey() { return required("SUPABASE_PUBLISHABLE_KEY"); },
  get supabaseSecretKey() { return required("SUPABASE_SECRET_KEY"); },
  get hitpayApiKey() { return required("HITPAY_API_KEY"); },
  get hitpaySalt() { return required("HITPAY_SALT"); },
  get hitpayApiBase() { return process.env.HITPAY_API_BASE || "https://api.sandbox.hit-pay.com"; },
  get staffPassword() { return required("STAFF_PASSWORD"); },
  get appUrl() {
    // On Vercel, fall back to the site's own production address automatically.
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return (process.env.APP_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");
  },
};
