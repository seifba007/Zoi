import { Language } from "@/i18n/translations";
import { CartItem, Order, Product, RestaurantSettings } from "@/types";

/**
 * Invoicing.
 *
 * Menu prices are gross (what the guest pays), so every net figure here is
 * derived by dividing the gross back out — never the other way around, or the
 * cents stop adding up to the amount that was actually charged.
 *
 * VAT follows the German rule for food sold to take away or delivered: 7% on
 * food, 19% on drinks. Change RATES below if you serve guests at tables (then
 * food is 19% too) or operate outside Germany.
 */

export const VAT_RATES = {
  food: 0.07,
  drinks: 0.19,
} as const;

/** Categories billed at the drinks rate. */
const DRINK_CATEGORY_IDS = ["cat-getraenke"];

const round = (value: number) => Math.round(value * 100) / 100;

export const lineGross = (item: CartItem) =>
  (item.unitPrice + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity;

/** A dish that has since been deleted falls back to the food rate. */
const rateFor = (item: CartItem, products: Product[]) => {
  const product = products.find((entry) => entry.id === item.productId);
  return product && DRINK_CATEGORY_IDS.includes(product.categoryId) ? VAT_RATES.drinks : VAT_RATES.food;
};

export interface VatBucket {
  rate: number;
  net: number;
  vat: number;
  gross: number;
}

export interface InvoiceTotals {
  /** One entry per VAT rate that actually occurs on the invoice. */
  buckets: VatBucket[];
  net: number;
  vat: number;
  gross: number;
}

/**
 * Splits an order into VAT buckets.
 *
 * The delivery fee follows the food rate: it is an ancillary service to the
 * meal, not a separate supply.
 */
export const invoiceTotals = (order: Order, products: Product[]): InvoiceTotals => {
  const byRate = new Map<number, number>();

  order.items.forEach((item) => {
    const rate = rateFor(item, products);
    byRate.set(rate, (byRate.get(rate) ?? 0) + lineGross(item));
  });

  if (order.deliveryFee > 0) {
    byRate.set(VAT_RATES.food, (byRate.get(VAT_RATES.food) ?? 0) + order.deliveryFee);
  }

  const buckets: VatBucket[] = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, gross]) => {
      const net = round(gross / (1 + rate));
      return { rate, gross: round(gross), net, vat: round(gross - net) };
    });

  return {
    buckets,
    net: round(buckets.reduce((sum, bucket) => sum + bucket.net, 0)),
    vat: round(buckets.reduce((sum, bucket) => sum + bucket.vat, 0)),
    gross: round(buckets.reduce((sum, bucket) => sum + bucket.gross, 0)),
  };
};

/* ------------------------------------------------------------------ export */

const CSV_SEPARATOR = ";"; // German Excel expects semicolons

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Bookkeeping export for the whole filtered range. */
export const invoicesToCsv = (orders: Order[], products: Product[], language: Language): string => {
  const labels = LABELS[language];
  const header = [
    labels.invoiceNo,
    labels.date,
    labels.customer,
    labels.orderType,
    labels.payment,
    `${labels.net} 7%`,
    `${labels.vat} 7%`,
    `${labels.net} 19%`,
    `${labels.vat} 19%`,
    labels.net,
    labels.vat,
    labels.total,
  ];

  const rows = orders.map((order) => {
    const totals = invoiceTotals(order, products);
    const food = totals.buckets.find((bucket) => bucket.rate === VAT_RATES.food);
    const drinks = totals.buckets.find((bucket) => bucket.rate === VAT_RATES.drinks);

    return [
      order.number,
      new Date(order.createdAt).toLocaleDateString(language === "de" ? "de-DE" : "en-GB"),
      order.customer.name,
      order.type === "delivery" ? labels.delivery : labels.pickup,
      order.payment.method,
      (food?.net ?? 0).toFixed(2),
      (food?.vat ?? 0).toFixed(2),
      (drinks?.net ?? 0).toFixed(2),
      (drinks?.vat ?? 0).toFixed(2),
      totals.net.toFixed(2),
      totals.vat.toFixed(2),
      totals.gross.toFixed(2),
    ];
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(CSV_SEPARATOR)).join("\r\n");
};

export const downloadCsv = (csv: string, filename: string) => {
  // BOM so Excel opens the umlauts correctly
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* ---------------------------------------------------------------- document */

const LABELS = {
  de: {
    invoice: "Rechnung",
    invoiceNo: "Rechnungsnummer",
    date: "Rechnungsdatum",
    serviceDate: "Leistungsdatum",
    customer: "Rechnung an",
    orderType: "Art",
    pickup: "Abholung",
    delivery: "Lieferung",
    payment: "Zahlung",
    paid: "bezahlt",
    unpaid: "offen",
    refunded: "erstattet",
    failed: "fehlgeschlagen",
    qty: "Menge",
    item: "Position",
    unit: "Einzelpreis",
    vatRate: "MwSt.",
    lineTotal: "Gesamt",
    deliveryFee: "Liefergebühr",
    subtotal: "Zwischensumme",
    net: "Netto",
    vat: "MwSt.",
    total: "Gesamtbetrag",
    vatBreakdown: "MwSt.-Aufschlüsselung",
    smallBusiness:
      "Alle Beträge in Euro. Preise sind Bruttopreise inklusive der ausgewiesenen Mehrwertsteuer.",
    thanks: "Vielen Dank für deine Bestellung!",
    taxId: "USt-IdNr.",
    note: "Anmerkung",
  },
  en: {
    invoice: "Invoice",
    invoiceNo: "Invoice number",
    date: "Invoice date",
    serviceDate: "Date of supply",
    customer: "Bill to",
    orderType: "Type",
    pickup: "Pickup",
    delivery: "Delivery",
    payment: "Payment",
    paid: "paid",
    unpaid: "open",
    refunded: "refunded",
    failed: "failed",
    qty: "Qty",
    item: "Item",
    unit: "Unit price",
    vatRate: "VAT",
    lineTotal: "Total",
    deliveryFee: "Delivery fee",
    subtotal: "Subtotal",
    net: "Net",
    vat: "VAT",
    total: "Amount due",
    vatBreakdown: "VAT breakdown",
    smallBusiness:
      "All amounts in euro. Prices are gross and include the VAT shown above.",
    thanks: "Thank you for your order!",
    taxId: "VAT ID",
    note: "Note",
  },
} as const;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (character) =>
    character === "&" ? "&amp;" : character === "<" ? "&lt;" : character === ">" ? "&gt;" : "&quot;"
  );

export const buildInvoiceHtml = (
  order: Order,
  settings: RestaurantSettings,
  products: Product[],
  language: Language
): string => {
  const labels = LABELS[language];
  const locale = language === "de" ? "de-DE" : "en-GB";
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(value)
    );

  const totals = invoiceTotals(order, products);
  const paymentLabel =
    order.payment.status === "paid"
      ? labels.paid
      : order.payment.status === "refunded"
        ? labels.refunded
        : order.payment.status === "failed"
          ? labels.failed
          : labels.unpaid;

  const address = [
    order.customer.street && `${order.customer.street} ${order.customer.houseNumber ?? ""}`.trim(),
    [order.customer.zip, order.customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line as string)}</div>`)
    .join("");

  const rows = order.items
    .map((item) => {
      const name = item.name[language] || item.name.de;
      const extras = item.extras
        .map((extra) => extra.name[language] || extra.name.de)
        .join(", ");
      const unit = item.unitPrice + item.extras.reduce((sum, extra) => sum + extra.price, 0);
      const rate = rateFor(item, products);

      return `
        <tr>
          <td class="num">${item.quantity}×</td>
          <td>
            <strong>${escapeHtml(name)}</strong>
            ${extras ? `<div class="muted">+ ${escapeHtml(extras)}</div>` : ""}
            ${item.note ? `<div class="muted">${escapeHtml(labels.note)}: ${escapeHtml(item.note)}</div>` : ""}
          </td>
          <td class="num">${money(unit)}</td>
          <td class="num">${Math.round(rate * 100)}%</td>
          <td class="num">${money(lineGross(item))}</td>
        </tr>`;
    })
    .join("");

  const deliveryRow =
    order.deliveryFee > 0
      ? `<tr>
           <td class="num">1×</td>
           <td><strong>${escapeHtml(labels.deliveryFee)}</strong>${
             order.zoneLabel ? `<div class="muted">${escapeHtml(order.zoneLabel)}</div>` : ""
           }</td>
           <td class="num">${money(order.deliveryFee)}</td>
           <td class="num">${Math.round(VAT_RATES.food * 100)}%</td>
           <td class="num">${money(order.deliveryFee)}</td>
         </tr>`
      : "";

  const vatRows = totals.buckets
    .map(
      (bucket) => `
        <tr>
          <td>${escapeHtml(labels.vat)} ${Math.round(bucket.rate * 100)}%</td>
          <td class="num">${money(bucket.net)}</td>
          <td class="num">${money(bucket.vat)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(labels.invoice)} ${escapeHtml(order.number)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #181413;
    background: #fff;
  }
  .sheet { max-width: 178mm; margin: 0 auto; padding: 10mm 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand img { width: 42px; height: 42px; border-radius: 12px; object-fit: cover; }
  .brand .name { font-size: 20pt; font-weight: 800; letter-spacing: -0.02em; }
  .seller { text-align: right; font-size: 9pt; color: #4A423C; }
  h1 { font-size: 17pt; margin: 14mm 0 0; letter-spacing: -0.01em; }
  .meta { display: flex; justify-content: space-between; gap: 24px; margin-top: 6mm; font-size: 10pt; }
  .meta dt { color: #6B625B; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.08em; }
  .meta dd { margin: 2px 0 8px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 8mm; font-size: 10pt; }
  thead th {
    text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.08em;
    color: #6B625B; border-bottom: 1px solid #C0BAB4; padding: 0 6px 6px;
  }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #E3E0DD; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .muted { color: #6B625B; font-size: 9pt; }
  .totals { margin-top: 8mm; margin-left: auto; width: 82mm; font-size: 10pt; }
  .totals td { padding: 5px 6px; }
  .totals tr.grand td {
    border-top: 2px solid #181413; font-size: 12pt; font-weight: 800; padding-top: 8px;
  }
  .vat { margin-top: 8mm; width: 82mm; font-size: 9.5pt; }
  .vat caption {
    text-align: left; font-size: 8.5pt; text-transform: uppercase;
    letter-spacing: 0.08em; color: #6B625B; padding-bottom: 4px;
  }
  .vat td { padding: 4px 6px; border-bottom: 1px solid #E3E0DD; }
  footer { margin-top: 14mm; font-size: 8.5pt; color: #6B625B; border-top: 1px solid #E3E0DD; padding-top: 5mm; }
  .thanks { margin-top: 8mm; font-weight: 700; }
  @media print { .sheet { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <header>
      <div class="brand">
        <img src="${window.location.origin}/zoi-logo.jpg" alt="" />
        <span class="name">${escapeHtml(settings.name)}</span>
      </div>
      <div class="seller">
        <div>${escapeHtml(settings.address.street)}</div>
        <div>${escapeHtml(settings.address.zip)} ${escapeHtml(settings.address.city)}</div>
        <div>${escapeHtml(settings.phone)}</div>
        <div>${escapeHtml(settings.email)}</div>
        ${settings.taxId ? `<div>${escapeHtml(labels.taxId)}: ${escapeHtml(settings.taxId)}</div>` : ""}
      </div>
    </header>

    <h1>${escapeHtml(labels.invoice)} ${escapeHtml(order.number)}</h1>

    <div class="meta">
      <dl>
        <dt>${escapeHtml(labels.customer)}</dt>
        <dd>
          ${escapeHtml(order.customer.name)}
          ${address}
          ${order.customer.email ? `<div class="muted">${escapeHtml(order.customer.email)}</div>` : ""}
          <div class="muted">${escapeHtml(order.customer.phone)}</div>
        </dd>
      </dl>
      <dl>
        <dt>${escapeHtml(labels.date)}</dt>
        <dd>${date(order.createdAt)}</dd>
        <dt>${escapeHtml(labels.orderType)}</dt>
        <dd>${escapeHtml(order.type === "delivery" ? labels.delivery : labels.pickup)}</dd>
        <dt>${escapeHtml(labels.payment)}</dt>
        <dd>${escapeHtml(order.payment.method)} · ${escapeHtml(paymentLabel)}</dd>
      </dl>
    </div>

    <table>
      <thead>
        <tr>
          <th class="num">${escapeHtml(labels.qty)}</th>
          <th>${escapeHtml(labels.item)}</th>
          <th class="num">${escapeHtml(labels.unit)}</th>
          <th class="num">${escapeHtml(labels.vatRate)}</th>
          <th class="num">${escapeHtml(labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${deliveryRow}
      </tbody>
    </table>

    <table class="totals">
      <tbody>
        <tr><td>${escapeHtml(labels.net)}</td><td class="num">${money(totals.net)}</td></tr>
        <tr><td>${escapeHtml(labels.vat)}</td><td class="num">${money(totals.vat)}</td></tr>
        <tr class="grand"><td>${escapeHtml(labels.total)}</td><td class="num">${money(totals.gross)}</td></tr>
      </tbody>
    </table>

    <table class="vat">
      <caption>${escapeHtml(labels.vatBreakdown)}</caption>
      <tbody>
        <tr>
          <td></td>
          <td class="num">${escapeHtml(labels.net)}</td>
          <td class="num">${escapeHtml(labels.vat)}</td>
        </tr>
        ${vatRows}
      </tbody>
    </table>

    <p class="thanks">${escapeHtml(labels.thanks)}</p>

    <footer>
      ${escapeHtml(labels.smallBusiness)}<br />
      ${escapeHtml(settings.name)} · ${escapeHtml(settings.address.street)} ·
      ${escapeHtml(settings.address.zip)} ${escapeHtml(settings.address.city)}
    </footer>
  </div>
</body>
</html>`;
};

/**
 * Opens the invoice in the browser's print dialog, where "Save as PDF" is one
 * click away. A hidden iframe rather than a popup: no blocker to fight, and
 * the admin page keeps its state.
 */
export const printInvoice = (
  order: Order,
  settings: RestaurantSettings,
  products: Product[],
  language: Language
): void => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(buildInvoiceHtml(order, settings, products, language));
  doc.close();

  const run = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // Safari fires afterprint late; a timeout is the portable cleanup.
    window.setTimeout(() => frame.remove(), 1000);
  };

  if (doc.readyState === "complete") {
    window.setTimeout(run, 60);
  } else {
    frame.onload = () => window.setTimeout(run, 60);
  }
};
