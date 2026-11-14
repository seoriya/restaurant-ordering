import "server-only";
import { supabasePublic } from "@/lib/supabase/server";
import type { MenuCategory } from "@/lib/types";

type Row = {
  id: number;
  name: string;
  sort: number;
  menu_items: {
    id: number; name: string; description: string; price_cents: number;
    image_url: string | null; available: boolean; sort: number;
    option_groups: {
      id: number; name: string; min_select: number; max_select: number; sort: number;
      options: { id: number; name: string; price_cents: number; sort: number }[];
    }[];
  }[];
};

const bySort = <T extends { sort: number; id: number }>(a: T, b: T) => a.sort - b.sort || a.id - b.id;

export async function getMenu(): Promise<MenuCategory[]> {
  const { data, error } = await supabasePublic()
    .from("categories")
    .select(
      "id, name, sort, menu_items(id, name, description, price_cents, image_url, available, sort, option_groups(id, name, min_select, max_select, sort, options(id, name, price_cents, sort)))"
    );
  if (error) throw new Error(`Could not load menu: ${error.message}`);

  return (data as Row[]).sort(bySort).map((c) => ({
    id: c.id,
    name: c.name,
    items: c.menu_items.sort(bySort).map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price_cents: i.price_cents,
      image_url: i.image_url,
      available: i.available,
      option_groups: i.option_groups.sort(bySort).map((g) => ({
        id: g.id,
        name: g.name,
        min_select: g.min_select,
        max_select: g.max_select,
        options: g.options.sort(bySort).map((o) => ({ id: o.id, name: o.name, price_cents: o.price_cents })),
      })),
    })),
  }));
}
