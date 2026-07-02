"use client";

/**
 * One tap → browser print dialog → "Save as PDF".
 * This is the RTL-safe way to produce Arabic/Hebrew PDFs: the browser's
 * own text shaping renders the document exactly as shown.
 */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-xl bg-accent text-white font-semibold px-5 py-3 hover:opacity-95 active:scale-[.99] transition"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
      {label}
    </button>
  );
}
