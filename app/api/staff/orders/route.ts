import { NextResponse } from "next/server";
import { isStaff } from "@/lib/staff-auth";
import { listPaidOrders } from "@/lib/orders";

export async function GET(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const includeDone = new URL(req.url).searchParams.get("done") === "1";
  return NextResponse.json({ orders: await listPaidOrders(includeDone) });
}
