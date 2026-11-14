"use client";

import { useEffect, useMemo, useState } from "react";
import type { MenuItem, MenuOptionGroup } from "@/lib/types";
import { formatSGD } from "@/lib/money";
import { useCart } from "@/components/CartProvider";
import { DishImage } from "@/components/DishImage";

const isSingle = (g: MenuOptionGroup) => g.max_select === 1 && g.min_select === 1;

export function DishSheet({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  // Required single-choice groups start with their first option picked (e.g. "Regular").
  const [selected, setSelected] = useState<number[]>(() =>
    item.option_groups.filter(isSingle).map((g) => g.options[0]?.id).filter(Boolean) as number[]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const allOptions = useMemo(() => item.option_groups.flatMap((g) => g.options), [item]);
  const unitCents =
    item.price_cents + allOptions.filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.price_cents, 0);

  const missing = item.option_groups.find(
    (g) => g.options.filter((o) => selected.includes(o.id)).length < g.min_select
  );

  function toggle(group: MenuOptionGroup, optionId: number) {
    setSelected((cur) => {
      const inGroup = group.options.map((o) => o.id);
      if (group.max_select === 1) {
        const without = cur.filter((id) => !inGroup.includes(id));
        // optional single choice can be un-ticked
        return cur.includes(optionId) && group.min_select === 0 ? without : [...without, optionId];
      }
      if (cur.includes(optionId)) return cur.filter((id) => id !== optionId);
      const count = cur.filter((id) => inGroup.includes(id)).length;
      return count >= group.max_select ? cur : [...cur, optionId];
    });
  }

  function add() {
    if (missing) return;
    cart.addLine({
      menuItemId: item.id,
      optionIds: [...selected].sort((a, b) => a - b),
      quantity,
      note: note.trim(),
      name: item.name,
      optionNames: allOptions.filter((o) => selected.includes(o.id)).map((o) => o.name),
      previewUnitCents: unitCents,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white"
      >
        <div className="overflow-y-auto">
          <div className="relative">
            <DishImage src={item.image_url} alt={item.name} className="h-52 w-full" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 text-xl shadow"
            >
              ×
            </button>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <h2 className="text-xl font-bold">{item.name}</h2>
              <p className="text-sm text-stone-500">{item.description}</p>
              <p className="mt-1 font-semibold text-brand-600">{formatSGD(item.price_cents)}</p>
            </div>

            {item.option_groups.map((g) => (
              <fieldset key={g.id}>
                <legend className="mb-2 flex w-full items-center justify-between font-semibold">
                  <span>{g.name}</span>
                  <span className="text-xs font-normal text-stone-500">
                    {g.min_select > 0 ? "Required" : `Optional${g.max_select > 1 ? `, up to ${g.max_select}` : ""}`}
                  </span>
                </legend>
                <div className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
                  {g.options.map((o) => {
                    const checked = selected.includes(o.id);
                    return (
                      <label key={o.id} className="flex cursor-pointer items-center gap-3 px-4 py-3">
                        <input
                          type={g.max_select === 1 ? "radio" : "checkbox"}
                          name={`group-${g.id}`}
                          checked={checked}
                          onChange={() => toggle(g, o.id)}
                          onClick={() => g.max_select === 1 && checked && g.min_select === 0 && toggle(g, o.id)}
                          className="h-5 w-5 accent-brand-600"
                        />
                        <span className="flex-1">{o.name}</span>
                        {o.price_cents > 0 && <span className="text-sm text-stone-500">+{formatSGD(o.price_cents)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <label className="block">
              <span className="mb-2 block font-semibold">Note for the kitchen</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="e.g. no spring onion"
                className="w-full rounded-xl border border-stone-300 p-3 text-base"
              />
            </label>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-11 w-11 rounded-full border border-stone-300 text-2xl"
                aria-label="Less"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="h-11 w-11 rounded-full border border-stone-300 text-2xl"
                aria-label="More"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-200 p-4">
          <button
            onClick={add}
            disabled={!!missing}
            className="w-full rounded-2xl bg-brand-600 py-4 font-semibold text-white disabled:bg-stone-300"
          >
            {missing ? `Choose ${missing.name}` : `Add to cart · ${formatSGD(unitCents * quantity)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
