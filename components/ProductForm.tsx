"use client";

import { useState, useTransition } from "react";
import { addProductAction, updateProductAction } from "@/lib/actions";
import type { Product } from "@/lib/types";

export type FormLabels = {
  sku: string;
  nameAr: string;
  nameHe: string;
  categoryAr: string;
  categoryHe: string;
  costPrice: string;
  salePrice: string;
  stock: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/70">{label}</span>
      {children}
    </label>
  );
}

/** Add or edit a product with a single save tap. */
export default function ProductForm({
  initial,
  labels,
  saveLabel,
  errorLabel,
  onDone,
}: {
  initial?: Product;
  labels: FormLabels;
  saveLabel: string;
  errorLabel: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = initial
        ? await updateProductAction(initial.id, fd)
        : await addProductAction(fd);
      if (result.ok) onDone();
      else setError(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={labels.sku}>
        <input name="sku" required defaultValue={initial?.sku} className={inputCls} dir="ltr" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={labels.nameAr}>
          <input name="name_ar" required defaultValue={initial?.name.ar} className={inputCls} dir="rtl" />
        </Field>
        <Field label={labels.nameHe}>
          <input name="name_he" required defaultValue={initial?.name.he} className={inputCls} dir="rtl" />
        </Field>
        <Field label={labels.categoryAr}>
          <input name="category_ar" required defaultValue={initial?.category.ar} className={inputCls} dir="rtl" />
        </Field>
        <Field label={labels.categoryHe}>
          <input name="category_he" required defaultValue={initial?.category.he} className={inputCls} dir="rtl" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label={labels.costPrice}>
          <input
            name="costPrice"
            type="number"
            min="0"
            step="0.5"
            required
            inputMode="decimal"
            defaultValue={initial?.costPrice}
            className={inputCls}
            dir="ltr"
          />
        </Field>
        <Field label={labels.salePrice}>
          <input
            name="salePrice"
            type="number"
            min="0"
            step="0.5"
            required
            inputMode="decimal"
            defaultValue={initial?.salePrice}
            className={inputCls}
            dir="ltr"
          />
        </Field>
        <Field label={labels.stock}>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            inputMode="numeric"
            defaultValue={initial?.stock ?? 0}
            className={inputCls}
            dir="ltr"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-loss">{errorLabel}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent text-white font-semibold py-3.5 text-[15px] hover:opacity-95 active:scale-[.99] transition disabled:opacity-60"
      >
        {pending ? "…" : saveLabel}
      </button>
    </form>
  );
}
