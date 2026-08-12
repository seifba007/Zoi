import { useMemo, useState } from "react";
import { Download, Euro, FileSpreadsheet, FileText, Percent, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, PaymentChip, StatCard } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { endOfDay, filterByRange, startOfDay } from "@/services/analytics";
import { downloadCsv, invoiceTotals, invoicesToCsv, printInvoice } from "@/services/invoice";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

/**
 * Invoicing.
 *
 * Every order that was not cancelled is billable, so the list is derived from
 * the orders themselves and the order number doubles as the invoice number —
 * one document per order, always traceable back to it.
 */

type RangeKey = "today" | "7d" | "30d" | "custom";

const RANGES: { key: RangeKey; label: TranslationKey }[] = [
  { key: "today", label: "admin.sales.range.today" },
  { key: "7d", label: "admin.sales.range.7d" },
  { key: "30d", label: "admin.sales.range.30d" },
  { key: "custom", label: "admin.sales.range.custom" },
];

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const AdminInvoices = () => {
  const { orders, products, settings } = useStore();
  const { t, formatPrice, formatDate, language } = useI18n();

  const [range, setRange] = useState<RangeKey>("30d");
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(Date.now() - 29 * 864e5)));
  const [customTo, setCustomTo] = useState(toInputDate(new Date()));
  const [query, setQuery] = useState("");

  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7d": {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return { from: startOfDay(start), to: endOfDay(now) };
      }
      case "30d": {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        return { from: startOfDay(start), to: endOfDay(now) };
      }
      case "custom":
      default:
        return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)) };
    }
  }, [range, customFrom, customTo]);

  /** Cancelled orders are not invoiced — there is nothing to charge for. */
  const invoices = useMemo(() => {
    const term = query.trim().toLowerCase();

    return filterByRange(orders, from, to)
      .filter((order) => order.status !== "cancelled")
      .filter((order) =>
        term
          ? order.number.toLowerCase().includes(term) ||
            order.customer.name.toLowerCase().includes(term)
          : true
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, from, to, query]);

  const totals = useMemo(
    () =>
      invoices.reduce(
        (sum, order) => {
          const amounts = invoiceTotals(order, products);
          return {
            net: sum.net + amounts.net,
            vat: sum.vat + amounts.vat,
            gross: sum.gross + amounts.gross,
          };
        },
        { net: 0, vat: 0, gross: 0 }
      ),
    [invoices, products]
  );

  const exportCsv = () => {
    const csv = invoicesToCsv(invoices, products, language);
    downloadCsv(csv, `zoi-invoices-${toInputDate(from)}_${toInputDate(to)}.csv`);
  };

  return (
    <>
      <PageHeader
        title={t("admin.invoices.title")}
        subtitle={t("admin.invoices.subtitle")}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={invoices.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            {t("admin.invoices.exportCsv")}
          </Button>
        }
      />

      {/* range */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                range === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
              )}
            >
              {t(label)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label={t("admin.hours.from")}
                className="field h-11 w-full sm:w-40"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="date"
                aria-label={t("admin.hours.to")}
                className="field h-11 w-full sm:w-40"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("admin.invoices.search")}
              aria-label={t("admin.invoices.search")}
              className="field h-11 pl-10 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.invoices.count")} value={invoices.length} icon={ReceiptText} tone="primary" />
        <StatCard label={t("admin.invoices.net")} value={formatPrice(totals.net)} icon={Euro} />
        <StatCard label={t("admin.invoices.vat")} value={formatPrice(totals.vat)} icon={Percent} tone="warning" />
        <StatCard label={t("admin.invoices.gross")} value={formatPrice(totals.gross)} icon={Euro} tone="success" />
      </div>

      <div className="mt-4">
        <Panel title={t("admin.invoices.list")} description={t("admin.invoices.vatHint")}>
          {invoices.length === 0 ? (
            <EmptyState title={t("admin.invoices.empty")} icon={FileText} />
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 pb-3 font-bold">{t("admin.invoices.number")}</th>
                    <th className="px-2 pb-3 font-bold">{t("admin.orders.createdAt")}</th>
                    <th className="px-2 pb-3 font-bold">{t("admin.orders.customer")}</th>
                    <th className="px-2 pb-3 font-bold">{t("admin.orders.paymentStatus")}</th>
                    <th className="px-2 pb-3 text-right font-bold">{t("admin.invoices.net")}</th>
                    <th className="px-2 pb-3 text-right font-bold">{t("admin.invoices.vat")}</th>
                    <th className="px-2 pb-3 text-right font-bold">{t("admin.invoices.gross")}</th>
                    <th className="px-2 pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((order) => {
                    const amounts = invoiceTotals(order, products);
                    return (
                      <tr key={order.id} className="border-t border-border/60 hover:bg-muted/40">
                        <td className="px-2 py-3 font-mono text-xs font-bold">{order.number}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="max-w-[12rem] truncate px-2 py-3 font-medium">
                          {order.customer.name}
                        </td>
                        <td className="px-2 py-3">
                          <PaymentChip status={order.payment.status} />
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                          {formatPrice(amounts.net)}
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                          {formatPrice(amounts.vat)}
                        </td>
                        <td className="px-2 py-3 text-right font-bold tabular-nums">
                          {formatPrice(amounts.gross)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => printInvoice(order, settings, products, language)}
                          >
                            <Download className="h-4 w-4" />
                            {t("admin.invoices.download")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
};

export default AdminInvoices;
