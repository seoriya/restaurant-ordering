"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-brand-600 px-3 py-1 font-semibold text-white">
      Print
    </button>
  );
}
