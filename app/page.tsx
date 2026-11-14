import { getMenu } from "@/lib/menu";
import { MenuView } from "@/components/MenuView";
import { normalizeTable } from "@/lib/validate";

export const dynamic = "force-dynamic";

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const { table } = await searchParams;
  const menu = await getMenu();
  return <MenuView menu={menu} tableFromQr={table ? normalizeTable(table) : null} />;
}
