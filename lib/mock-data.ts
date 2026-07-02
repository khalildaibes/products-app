import { Product, Sale } from "./types";

export const mockProducts: Product[] = [
  { id: 1, sku: "FEED-001", name: { ar: "شعير مجروش للخيول 25 كغ", he: "שעורה גרוסה לסוסים 25 ק\"ג" }, category: { ar: "أعلاف", he: "מזון לסוסים" }, costPrice: 55, salePrice: 85, stock: 120 },
  { id: 2, sku: "FEED-002", name: { ar: "دريس برسيم فاخر (بالة)", he: "חציר אספסת משובח (חבילה)" }, category: { ar: "أعلاف", he: "מזון לסוסים" }, costPrice: 40, salePrice: 65, stock: 200 },
  { id: 3, sku: "FEED-003", name: { ar: "علف مركّز للخيول 20 كغ", he: "תערובת מרוכזת לסוסים 20 ק\"ג" }, category: { ar: "أعلاف", he: "מזון לסוסים" }, costPrice: 70, salePrice: 110, stock: 90 },
  { id: 4, sku: "TRT-001", name: { ar: "مكافآت تفاح وجزر للخيول 1 كغ", he: "חטיפי תפוח וגזר לסוסים 1 ק\"ג" }, category: { ar: "مكافآت", he: "חטיפים" }, costPrice: 18, salePrice: 35, stock: 250 },
  { id: 5, sku: "TRT-002", name: { ar: "حجر ملح معدني للعق", he: "אבן מלח מינרלית לליקוק" }, category: { ar: "مكافآت", he: "חטיפים" }, costPrice: 12, salePrice: 25, stock: 180 },
  { id: 6, sku: "ACC-001", name: { ar: "رسن قيادة جلد", he: "אפסר עור" }, category: { ar: "إكسسوارات", he: "אביזרים" }, costPrice: 60, salePrice: 120, stock: 45 },
  { id: 7, sku: "ACC-002", name: { ar: "سرج غربي كامل", he: "אוכף מערבי מלא" }, category: { ar: "إكسسوارات", he: "אביזרים" }, costPrice: 900, salePrice: 1550, stock: 8 },
  { id: 8, sku: "ACC-003", name: { ar: "بطانية سرج قطنية", he: "שמיכת אוכף כותנה" }, category: { ar: "إكسسوارات", he: "אביזרים" }, costPrice: 45, salePrice: 90, stock: 60 },
  { id: 9, sku: "CARE-001", name: { ar: "طقم تنظيف وفرشاة للخيل", he: "ערכת טיפוח ומברשות לסוס" }, category: { ar: "عناية وصيانة", he: "טיפוח ותחזוקה" }, costPrice: 35, salePrice: 70, stock: 75 },
  { id: 10, sku: "CARE-002", name: { ar: "زيت حوافر 500 مل", he: "שמן פרסות 500 מ\"ל" }, category: { ar: "عناية وصيانة", he: "טיפוח ותחזוקה" }, costPrice: 25, salePrice: 48, stock: 110 },
  { id: 11, sku: "CARE-003", name: { ar: "شامبو خيول بالصبار 1 لتر", he: "שמפו לסוסים עם אלוורה 1 ליטר" }, category: { ar: "عناية وصيانة", he: "טיפוח ותחזוקה" }, costPrice: 20, salePrice: 42, stock: 95 },
  { id: 12, sku: "MAINT-001", name: { ar: "مبيد حشرات للإسطبل 5 لتر", he: "קוטל חרקים לאורווה 5 ליטר" }, category: { ar: "عناية وصيانة", he: "טיפוח ותחזוקה" }, costPrice: 50, salePrice: 95, stock: 40 },
];

// Deterministic pseudo-random so the dashboard is stable between reloads.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const mockSellers = ["خالد", "أحمد", "יוסי"];
const mockCustomers = ["إسطبل النخبة", "חוות הרוכבים", "نادي الفروسية", "אורוות השרון"];

export function generateMockSales(days = 60): Sale[] {
  const rand = seeded(42);
  const sales: Sale[] = [];
  let id = 1;
  const today = new Date();

  for (let back = days - 1; back >= 0; back--) {
    const day = new Date(today);
    day.setDate(today.getDate() - back);
    const weekday = day.getDay();
    // Weekend-ish boost (Thu/Fri/Sat in the region)
    const dayFactor = weekday === 4 || weekday === 5 || weekday === 6 ? 1.5 : 1;

    for (const p of mockProducts) {
      const popularity = 0.4 + ((p.id * 7) % 10) / 10; // per-product baseline
      const n = Math.floor(rand() * 6 * popularity * dayFactor);
      if (n <= 0) continue;
      sales.push({
        id: id,
        productId: p.id,
        quantity: n,
        unitPrice: p.salePrice,
        unitCost: p.costPrice,
        date: isoDate(day),
        sellerName: mockSellers[id % mockSellers.length],
        customerName: mockCustomers[id % mockCustomers.length],
        invoiceNumber: `INV-${String(id).padStart(5, "0")}`,
      });
      id++;
    }
  }
  return sales;
}

export const mockSales: Sale[] = generateMockSales();
