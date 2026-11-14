import Link from "next/link";
import { isStaff } from "@/lib/staff-auth";
import { StaffBoard } from "@/components/StaffBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff · Orders", robots: { index: false } };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  if (!(await isStaff())) {
    return (
      <form action="/api/staff/login" method="post" className="mx-auto max-w-sm space-y-4 py-16">
        <h1 className="text-2xl font-bold">Staff login</h1>
        <input
          type="password"
          name="password"
          placeholder="Staff password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
        />
        {error && <p className="text-sm text-red-700">Wrong password.</p>}
        <button className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white">Log in</button>
      </form>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paid orders</h1>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/staff/qr" className="text-brand-600">QR codes</Link>
          <form action="/api/staff/logout" method="post">
            <button className="text-stone-500">Log out</button>
          </form>
        </div>
      </div>
      <StaffBoard />
    </div>
  );
}
