# Products Management / إدارة المنتجات / ניהול מוצרים

A mobile-first Next.js (App Router) app for running a small business: products, sales,
profit reports, PDF invoices — fully localized in **Arabic and Hebrew** (RTL).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/ar` (Arabic). Switch to Hebrew (`/he`) with the language button.

## Pages

- `/{ar|he}` — **Dashboard**: 30-day totals (revenue, cost, profit, units), 14-day trend chart, top sellers
- `/{ar|he}/products` — **Products**: one-tap operations — add (FAB), edit, delete, stock **+/−** steppers, quick-sell
- `/{ar|he}/sales` — **Sales**: every sale records *who sold it, to whom, what, and at what price*; one-tap new sale; PDF invoice per sale
- **Cart** (floating button, everywhere): add each product once, pick quantities, optional supply address + delivery fee, checkout creates a multi-line **order** with its own PDF invoice (`/{ar|he}/print/order/{id}`); orders are listed in Admin → Orders
- `/{ar|he}/reports` — **Reports**: daily (14 days) / weekly (8 weeks) toggle, chart + breakdown table
- `/{ar|he}/admin` — **Admin panel**: all operations in one place — product CRUD, sales, the **activity log** (every add/change is recorded), and PDF exports
- `/{ar|he}/print/invoice/{saleId}` — PDF invoice for a sale/order
- `/{ar|he}/print/sales-report?days=30` — PDF sales report

## Mobile-first

The UI is designed for phones: fixed bottom navigation, card lists instead of wide
tables, floating action buttons, bottom-sheet forms, and large touch targets. The
desktop gets a sidebar and full tables.

## PDFs

Invoices and sales reports are print-optimized A4 documents. Tap **Download PDF**
and choose *Save as PDF* — the browser's print engine shapes Arabic/Hebrew text
correctly (which client-side PDF libraries generally don't).

## Activity log

Every add or change — product created/updated/deleted, stock adjustment, every
sale — is logged with who did it, what changed, and when. View it in
**Admin → Activity log**. When Strapi is connected, entries are stored in the
`activity-log` collection (append-only).

## Connecting Strapi

Without configuration the app runs on an in-memory demo store (full read/write,
resets on restart). To persist data in Strapi:

1. Build the collections exactly as described in **[collections.md](collections.md)**.
2. Copy `.env.example` to `.env.local` and set:
   ```
   STRAPI_URL=https://your-strapi-host
   STRAPI_API_TOKEN=your-token
   ```
3. Restart the dev server — reads **and writes** (products, sales, activity log) now go to Strapi.

## Stack

Next.js 14 · TypeScript · Server Actions · Tailwind CSS · Recharts · Intl for currency (₪), numbers and dates per locale
