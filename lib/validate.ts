// Simple checks for the checkout form. Used on the server (and mirrored in the browser for nice messages).

export function normalizeSgPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^\+?65/, "");
  return /^[3689]\d{7}$/.test(digits) ? digits : null;
}

export function normalizeName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 60 ? name : null;
}

export function normalizeTable(input: string): string | null {
  const table = input.trim().toUpperCase();
  return /^[A-Z0-9]{1,4}$/.test(table) ? table : null;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
