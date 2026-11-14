import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { isStaff } from "@/lib/staff-auth";
import { env } from "@/lib/env";
import { RESTAURANT_NAME } from "@/lib/config";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function QrPage({ searchParams }: { searchParams: Promise<{ tables?: string }> }) {
  if (!(await isStaff())) redirect("/staff");
  const { tables } = await searchParams;
  const count = Math.min(50, Math.max(1, Number(tables) || 10));

  const codes = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const table = String(i + 1);
      const url = `${env.appUrl}/?table=${table}`;
      return { table, url, svg: await QRCode.toString(url, { type: "svg", margin: 1, width: 180 }) };
    })
  );

  return (
    <div className="space-y-4 py-4">
      <div className="no-print space-y-2">
        <h1 className="text-2xl font-bold">Table QR codes</h1>
        <p className="text-sm text-stone-600">
          Each code opens the menu with the table number filled in. Links point to <b>{env.appUrl}</b> — print these
          again after the site is online so they use the live address.
        </p>
        <form className="flex items-center gap-2 text-sm">
          <label>
            Number of tables{" "}
            <input name="tables" type="number" min={1} max={50} defaultValue={count} className="w-20 rounded-lg border border-stone-300 px-2 py-1" />
          </label>
          <button className="rounded-lg bg-stone-200 px-3 py-1 font-semibold">Update</button>
          <PrintButton />
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
        {codes.map((c) => (
          <div key={c.table} className="break-inside-avoid rounded-2xl bg-white p-4 text-center ring-1 ring-stone-300">
            <p className="font-bold">{RESTAURANT_NAME}</p>
            <div className="mx-auto w-40" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="text-xl font-bold">Table {c.table}</p>
            <p className="text-xs text-stone-500">Scan to order &amp; pay</p>
          </div>
        ))}
      </div>
    </div>
  );
}
