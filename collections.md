# Strapi Collections — Products Management App

How to build the Strapi content types that back this app. Create them in this order
(relations reference earlier types). Field names must match exactly — the app's
mapping lives in `lib/api.ts`.

Base URL and token go in `.env.local`:

```
STRAPI_URL=https://your-strapi-host
STRAPI_API_TOKEN=<full-access API token>
```

---

## 1. `product` (Collection Type)

Every item you buy and sell.

| Field         | Type            | Required | Notes                                    |
| ------------- | --------------- | -------- | ---------------------------------------- |
| `sku`         | Text (short)    | yes      | Unique. e.g. `OIL-001`                   |
| `name_ar`     | Text (short)    | yes      | Arabic product name                      |
| `name_he`     | Text (short)    | yes      | Hebrew product name                      |
| `category_ar` | Text (short)    | yes      | Arabic category label                    |
| `category_he` | Text (short)    | yes      | Hebrew category label                    |
| `costPrice`   | Number (decimal)| yes      | What one unit costs you (₪)              |
| `salePrice`   | Number (decimal)| yes      | What you sell one unit for (₪)           |
| `stock`       | Number (integer)| yes      | Units currently on hand                  |

Settings: enable **Draft & Publish = OFF** (the app expects published-only data).

---

## 2. `customer` (Collection Type)

Who buys from you. Referenced by every sale ("to whom").

| Field   | Type         | Required | Notes                          |
| ------- | ------------ | -------- | ------------------------------ |
| `name`  | Text (short) | yes      | Customer / business name       |
| `phone` | Text (short) | no       |                                |
| `email` | Email        | no       |                                |
| `notes` | Text (long)  | no       |                                |

---

## 3. `seller` (Collection Type)

Who makes the sale ("who sold it"). Usually your staff.

| Field    | Type         | Required | Notes                              |
| -------- | ------------ | -------- | ---------------------------------- |
| `name`   | Text (short) | yes      |                                    |
| `phone`  | Text (short) | no       |                                    |
| `active` | Boolean      | yes      | Default `true`; hide ex-employees  |

---

## 4. `sale` (Collection Type)

One sale line: **who** (seller) sold **what** (product) **to whom** (customer)
at **what price**. Prices are copied onto the sale at the moment it happens, so
later product-price edits never rewrite history.

| Field           | Type              | Required | Notes                                        |
| --------------- | ----------------- | -------- | -------------------------------------------- |
| `product`       | Relation → product (many-to-one) | yes | What was sold                     |
| `seller`        | Relation → seller (many-to-one)  | no  | Who sold it (app sends `sellerName`; link the relation in Strapi admin if you want strict reporting) |
| `customer`      | Relation → customer (many-to-one)| no  | Who bought it (app sends `customerName`) |
| `quantity`      | Number (integer)  | yes      | Units sold                                   |
| `unitPrice`     | Number (decimal)  | yes      | Actual price charged per unit (₪)            |
| `unitCost`      | Number (decimal)  | yes      | Product cost per unit at time of sale (₪)    |
| `date`          | Date              | yes      | Sale date (YYYY-MM-DD)                       |
| `invoiceNumber` | Text (short)      | no       | e.g. `INV-2026-00041`, used on the PDF       |
| `sellerName`    | Text (short)      | yes      | Denormalized copy for fast lists/PDFs        |
| `customerName`  | Text (short)      | yes      | Denormalized copy for fast lists/PDFs        |

> The two `*Name` copies keep list views and PDFs working even if a seller or
> customer record is later deleted.

---

## 5. `order` (Collection Type)

A multi-line order (several products bought together). Sales can exist without
an order; an order groups sale lines under one document/PDF.

| Field         | Type                                   | Required | Notes                              |
| ------------- | -------------------------------------- | -------- | ---------------------------------- |
| `orderNumber` | Text (short)                           | yes      | Unique, e.g. `ORD-2026-00012`      |
| `customer`    | Relation → customer (many-to-one)      | yes      |                                    |
| `seller`      | Relation → seller (many-to-one)        | yes      |                                    |
| `sales`       | Relation → sale (one-to-many)          | yes      | The lines that make up the order   |
| `status`      | Enumeration: `draft`, `confirmed`, `delivered`, `cancelled` | yes | Default `confirmed` |
| `date`        | Date                                   | yes      |                                    |
| `total`       | Number (decimal)                       | yes      | Sum of line `quantity × unitPrice` |

---

## 6. `activity-log` (Collection Type)

**Every add or change in the app writes one entry here.** The app calls this on
product create/update/delete, stock adjustments, and every recorded sale.
Treat it as append-only: no one should have update/delete permission on it.

| Field         | Type                | Required | Notes                                                       |
| ------------- | ------------------- | -------- | ----------------------------------------------------------- |
| `action`      | Enumeration: `create`, `update`, `delete`, `sale`, `stock` | yes | What happened |
| `entityType`  | Enumeration: `product`, `sale`, `customer`, `seller`, `order` | yes | What kind of record |
| `entityId`    | Text (short)        | yes      | ID of the affected record                                   |
| `summary_ar`  | Text (long)         | yes      | Human-readable line in Arabic                               |
| `summary_he`  | Text (long)         | yes      | Human-readable line in Hebrew                               |
| `payload`     | JSON                | no       | Full before/after snapshot for audits                       |
| `actor`       | Text (short)        | yes      | Who did it (seller name / "admin")                          |
| `happenedAt`  | Datetime            | yes      | When (the app sends this; don't rely on `createdAt` only)   |

---

## API token & permissions

1. Strapi admin → **Settings → API Tokens → Create new API Token**, type
   **Custom** (or Full access for simplicity).
2. If Custom, grant:
   - `product`: find, findOne, create, update, delete
   - `customer`, `seller`: find, findOne, create
   - `sale`, `order`: find, findOne, create
   - `activity-log`: find, findOne, create  ← **no update/delete** (append-only)
3. Put the token in `.env.local` as `STRAPI_API_TOKEN`.

## Checklist

- [ ] Create the 6 collection types above with exact field names
- [ ] Turn Draft & Publish off for all of them
- [ ] Create the API token and set `.env.local`
- [ ] Add at least one `seller` and one `customer` (the app suggests them in the sale form)
- [ ] Restart `npm run dev` — the app switches from mock data to Strapi automatically
