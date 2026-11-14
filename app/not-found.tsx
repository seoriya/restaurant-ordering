import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">Page not found</p>
      <Link href="/" className="mt-4 inline-block font-semibold text-brand-600">← Back to menu</Link>
    </div>
  );
}
