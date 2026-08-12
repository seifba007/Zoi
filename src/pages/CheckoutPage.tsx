import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ShoppingBag, Bike, Check, Loader2, MapPin,
  Wallet, CreditCard, AlertCircle, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCart } from "@/context/CartProvider";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { DeliveryQuote, getDeliveryQuote } from "@/services/deliveryService";
import { isDemoMode, processPayment } from "@/services/paymentService";
import { CustomerDetails, Order, OrderType, PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2;

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "", phone: "", email: "",
  street: "", houseNumber: "", zip: "", city: "", addressExtra: "", comment: "",
};

const CheckoutPage = () => {
  const { items, subtotal, clearCart, orderType, setOrderType, removeItem } = useCart();
  const { settings, addOrder, nextOrderNumber, products } = useStore();
  const { isOpen: orderingOpen, label: openingLabel } = useOpeningStatus();
  const { t, tr, formatPrice } = useI18n();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [checkingZone, setCheckingZone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDelivery = orderType === "delivery";
  const deliveryFee = isDelivery && quote?.deliverable ? quote.fee : 0;
  const total = subtotal + deliveryFee;

  // A cart that empties (or an order that just completed) sends you back
  useEffect(() => {
    if (items.length === 0 && !submitting) navigate("/menu", { replace: true });
  }, [items.length, submitting, navigate]);

  // Address edits invalidate a previous quote
  useEffect(() => {
    setQuote(null);
  }, [customer.street, customer.houseNumber, customer.zip, customer.city, orderType]);

  /**
   * A dish can sell out while it is sitting in someone's cart. Those lines are
   * surfaced here and block the order until they are removed.
   */
  const unavailableItems = useMemo(
    () =>
      items.filter((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return !product || !product.available;
      }),
    [items, products]
  );

  const removeUnavailable = () => {
    unavailableItems.forEach((item) => removeItem(item.lineId));
    toast.success(t("checkout.removeUnavailable"));
  };

  const enabledPayments = useMemo(
    () =>
      (Object.keys(settings.payments) as PaymentMethod[]).filter((method) => {
        if (!settings.payments[method]) return false;
        // Cash is always fine for pickup; delivery depends on the restaurant
        if (method === "cash" && isDelivery && !settings.cashOnDelivery) return false;
        return true;
      }),
    [settings.payments, settings.cashOnDelivery, isDelivery]
  );

  useEffect(() => {
    if (!enabledPayments.includes(payment) && enabledPayments.length > 0) {
      setPayment(enabledPayments[0]);
    }
  }, [enabledPayments, payment]);

  const update = (field: keyof CustomerDetails, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  /* -------------------------------------------------------- validation */

  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!customer.name.trim()) next.name = t("checkout.error.required");
    if (!customer.phone.trim()) next.phone = t("checkout.error.required");
    else if (!/^[+\d][\d\s/-]{5,}$/.test(customer.phone.trim())) next.phone = t("checkout.error.phone");

    if (isDelivery) {
      if (!customer.street?.trim()) next.street = t("checkout.error.required");
      if (!customer.houseNumber?.trim()) next.houseNumber = t("checkout.error.required");
      if (!customer.zip?.trim()) next.zip = t("checkout.error.required");
      if (!customer.city?.trim()) next.city = t("checkout.error.required");
      if (subtotal < settings.delivery.minOrderValue) {
        next.minOrder = t("checkout.error.minOrder", {
          amount: formatPrice(settings.delivery.minOrderValue),
        });
      }
      if (!quote) next.zone = t("checkout.zone.required");
      else if (!quote.deliverable) next.zone = t("checkout.zone.outside");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const checkZone = async () => {
    if (!customer.zip?.trim() || !customer.street?.trim()) {
      setErrors((current) => ({
        ...current,
        zip: customer.zip?.trim() ? current.zip : t("checkout.error.required"),
        street: customer.street?.trim() ? current.street : t("checkout.error.required"),
      }));
      return;
    }

    setCheckingZone(true);
    const result = await getDeliveryQuote(
      { street: customer.street, houseNumber: customer.houseNumber, zip: customer.zip, city: customer.city },
      subtotal,
      settings.delivery
    );
    setQuote(result);
    setCheckingZone(false);
    setErrors((current) => ({ ...current, zone: result.deliverable ? "" : t("checkout.zone.outside") }));
  };

  /* ------------------------------------------------------------ submit */

  const handleSubmit = async () => {
    if (!orderingOpen) {
      toast.error(t("checkout.error.closed"));
      return;
    }
    if (items.length === 0) {
      toast.error(t("checkout.error.emptyCart"));
      return;
    }
    if (unavailableItems.length > 0) {
      toast.error(t("checkout.error.unavailable"));
      return;
    }
    if (!validateDetails()) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    const orderNumber = nextOrderNumber();

    const result = await processPayment(
      {
        orderNumber,
        amount: total,
        method: payment,
        customerName: customer.name,
        customerEmail: customer.email,
        returnUrl: `${window.location.origin}/order/${orderNumber}`,
      },
      settings
    );

    if (result.status === "failed") {
      setSubmitting(false);
      toast.error(t("checkout.error.payment"), { description: result.error });
      return;
    }

    const estimatedMinutes = isDelivery ? settings.deliveryTimeMinutes : settings.prepTimeMinutes;
    const now = new Date();

    const order: Order = {
      id: `order-${now.getTime()}`,
      number: orderNumber,
      createdAt: now.toISOString(),
      type: orderType,
      status: "new",
      items,
      customer,
      payment: {
        method: payment,
        status: result.status,
        provider: result.provider,
        reference: result.reference,
      },
      subtotal,
      deliveryFee,
      total,
      distanceKm: quote?.deliverable ? quote.distanceKm : undefined,
      zoneLabel: quote?.deliverable ? quote.zone.label : undefined,
      estimatedMinutes,
      estimatedReadyAt: new Date(now.getTime() + estimatedMinutes * 60_000).toISOString(),
      statusHistory: [{ status: "new", at: now.toISOString() }],
    };

    addOrder(order);
    clearCart();
    navigate(`/order/${orderNumber}`, { replace: true });
  };

  /* -------------------------------------------------------------- view */

  const steps = [t("checkout.step.type"), t("checkout.step.details"), t("checkout.step.payment")];

  const goNext = () => {
    if (step === 1 && !validateDetails()) return;
    setStep((current) => Math.min(2, current + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24 pt-[5.5rem] lg:pt-28">
      <div className="container-width">
        {/* head */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("checkout.back")}
            </Link>
            <h1 className="display-xl mt-3 text-[clamp(1.85rem,4.5vw,2.75rem)]">{t("checkout.title")}</h1>
          </div>
        </div>

        {/* stepper */}
        <ol className="mt-8 flex items-center gap-2 sm:gap-4">
          {steps.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => index < step && setStep(index as Step)}
                  disabled={index > step}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    done && "bg-success text-success-foreground",
                    active && "bg-primary text-primary-foreground",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </button>
                <span
                  className={cn(
                    "hidden text-sm font-semibold sm:block",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {index < steps.length - 1 && (
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        {!orderingOpen && (
          <div className="notice-amber mt-6 flex flex-col gap-1 p-5">
            <p className="font-display text-base font-bold">{t("status.orderingClosed")}</p>
            <p className="text-sm text-ember-200/70">{openingLabel}</p>
          </div>
        )}

        {unavailableItems.length > 0 && (
          <div className="notice-amber mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-bold">{t("checkout.error.unavailable")}</p>
              <p className="mt-1 text-sm text-ember-200/70">
                {unavailableItems.map((item) => tr(item.name)).join(", ")}
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={removeUnavailable}>
              {t("checkout.removeUnavailable")}
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          {/* ---------------------------------------------------- form */}
          <div className="space-y-6">
            {/* keyed wrapper: the step remounts and fades in, no exit to stall on */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {step === 0 ? (
                /* step 0 — order type */
                <section
                  className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8"
                >
                  <h2 className="font-display text-xl font-bold">{t("checkout.type.title")}</h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {(["pickup", "delivery"] as OrderType[]).map((type) => {
                      const Icon = type === "pickup" ? ShoppingBag : Bike;
                      const active = orderType === type;
                      const disabled = type === "delivery" && !settings.delivery.enabled;
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={disabled}
                          onClick={() => setOrderType(type)}
                          aria-pressed={active}
                          className={cn(
                            "relative rounded-3xl border-2 p-6 text-left transition-all duration-200",
                            active ? "border-primary bg-primary/[0.05]" : "border-border hover:border-foreground/25",
                            disabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <h3 className="mt-4 font-display text-lg font-bold">
                            {t(type === "pickup" ? "status.pickup" : "status.delivery")}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t(type === "pickup" ? "checkout.type.pickup.text" : "checkout.type.delivery.text")}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-basil-300">
                            {t(type === "pickup" ? "status.pickupTime" : "status.deliveryTime", {
                              minutes: type === "pickup" ? settings.prepTimeMinutes : settings.deliveryTimeMinutes,
                            })}
                          </p>

                          {active && (
                            <motion.span
                              layoutId="type-check"
                              className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isDelivery && subtotal < settings.delivery.minOrderValue && (
                    <p className="notice-amber mt-5 flex items-start gap-2 p-4 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {t("checkout.error.minOrder", { amount: formatPrice(settings.delivery.minOrderValue) })}
                    </p>
                  )}

                  <Button size="lg" className="mt-7 w-full sm:w-auto" onClick={goNext}>
                    {t("checkout.next")}
                    <ArrowRight />
                  </Button>
                </section>
              ) : step === 1 ? (
                /* step 1 — details */
                <section
                  className="space-y-6"
                >
                  <div className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
                    <h2 className="font-display text-xl font-bold">{t("checkout.contact.title")}</h2>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field
                        id="name"
                        label={t("checkout.field.name")}
                        value={customer.name}
                        onChange={(value) => update("name", value)}
                        error={errors.name}
                        autoComplete="name"
                        required
                      />
                      <Field
                        id="phone"
                        label={t("checkout.field.phone")}
                        value={customer.phone}
                        onChange={(value) => update("phone", value)}
                        error={errors.phone}
                        type="tel"
                        autoComplete="tel"
                        required
                      />
                      <div className="sm:col-span-2">
                        <Field
                          id="email"
                          label={t("checkout.field.email")}
                          value={customer.email ?? ""}
                          onChange={(value) => update("email", value)}
                          type="email"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>

                  {isDelivery && (
                    <div className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
                      <h2 className="font-display text-xl font-bold">{t("checkout.address.title")}</h2>

                      <div className="mt-6 grid gap-5 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <Field
                            id="street"
                            label={t("checkout.field.street")}
                            value={customer.street ?? ""}
                            onChange={(value) => update("street", value)}
                            error={errors.street}
                            autoComplete="address-line1"
                            required
                          />
                        </div>
                        <Field
                          id="houseNumber"
                          label={t("checkout.field.houseNumber")}
                          value={customer.houseNumber ?? ""}
                          onChange={(value) => update("houseNumber", value)}
                          error={errors.houseNumber}
                          required
                        />
                        <Field
                          id="zip"
                          label={t("checkout.field.zip")}
                          value={customer.zip ?? ""}
                          onChange={(value) => update("zip", value)}
                          error={errors.zip}
                          autoComplete="postal-code"
                          inputMode="numeric"
                          required
                        />
                        <div className="sm:col-span-2">
                          <Field
                            id="city"
                            label={t("checkout.field.city")}
                            value={customer.city ?? ""}
                            onChange={(value) => update("city", value)}
                            error={errors.city}
                            autoComplete="address-level2"
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Field
                            id="addressExtra"
                            label={t("checkout.field.addressExtra")}
                            placeholder={t("checkout.field.addressExtra.placeholder")}
                            value={customer.addressExtra ?? ""}
                            onChange={(value) => update("addressExtra", value)}
                          />
                        </div>
                      </div>

                      {/* zone check */}
                      <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-muted/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-basil-300" />
                          <div className="text-sm">
                            {checkingZone ? (
                              <span className="text-muted-foreground">{t("checkout.zone.checking")}</span>
                            ) : quote?.deliverable ? (
                              <span className="font-semibold text-success">
                                {quote.free
                                  ? t("checkout.zone.free")
                                  : t("checkout.zone.ok", {
                                      zone: quote.zone.label,
                                      fee: formatPrice(quote.fee),
                                    })}
                                <span className="ml-2 font-normal text-muted-foreground">
                                  ({quote.distanceKm} km)
                                </span>
                              </span>
                            ) : quote ? (
                              <span className="font-semibold text-destructive">{t("checkout.zone.outside")}</span>
                            ) : (
                              <span className="text-muted-foreground">{t("checkout.zone.required")}</span>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={checkZone}
                          disabled={checkingZone}
                          className="shrink-0"
                        >
                          {checkingZone && <Loader2 className="animate-spin" />}
                          {t("checkout.checkZone")}
                        </Button>
                      </div>

                      {errors.zone && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {errors.zone}
                        </p>
                      )}
                      {errors.minOrder && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {errors.minOrder}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
                    <label htmlFor="comment" className="font-display text-xl font-bold">
                      {t("checkout.field.comment")}
                    </label>
                    <textarea
                      id="comment"
                      rows={3}
                      value={customer.comment ?? ""}
                      onChange={(event) => update("comment", event.target.value)}
                      placeholder={t("checkout.field.comment.placeholder")}
                      className="field mt-4 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                      <ArrowLeft />
                      {t("checkout.previous")}
                    </Button>
                    <Button size="lg" className="flex-1 sm:flex-none" onClick={goNext}>
                      {t("checkout.next")}
                      <ArrowRight />
                    </Button>
                  </div>
                </section>
              ) : (
                /* step 2 — payment */
                <section
                  className="space-y-6"
                >
                  <div className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
                    <h2 className="font-display text-xl font-bold">{t("checkout.payment.title")}</h2>

                    <div className="mt-6 space-y-3">
                      {enabledPayments.map((method) => {
                        const active = payment === method;
                        const Icon = method === "cash" ? Wallet : method === "card" ? CreditCard : ShieldCheck;
                        const title =
                          method === "cash"
                            ? t(isDelivery ? "checkout.payment.cash.delivery" : "checkout.payment.cash.pickup")
                            : t(`checkout.payment.${method}` as "checkout.payment.paypal");
                        const description =
                          method === "cash"
                            ? t("checkout.payment.cash")
                            : t(`checkout.payment.${method}.text` as "checkout.payment.paypal.text");

                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPayment(method)}
                            aria-pressed={active}
                            className={cn(
                              "flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-left transition-all duration-200",
                              active ? "border-primary bg-primary/[0.05]" : "border-border hover:border-foreground/25"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-display text-base font-bold">{title}</span>
                              <span className="block text-sm text-muted-foreground">{description}</span>
                            </span>
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                active ? "border-primary bg-primary text-primary-foreground" : "border-input"
                              )}
                            >
                              {active && <Check className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isDemoMode(settings) && payment !== "cash" && (
                      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {t("checkout.demoNotice")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" size="lg" onClick={() => setStep(1)} disabled={submitting}>
                      <ArrowLeft />
                      {t("checkout.previous")}
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={submitting || !orderingOpen || unavailableItems.length > 0}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" />
                          {t("checkout.submitting")}
                        </>
                      ) : (
                        <>
                          {t("checkout.submit")}
                          <span className="tabular-nums">· {formatPrice(total)}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              )}
            </motion.div>
          </div>

          {/* -------------------------------------------------- summary */}
          <aside className="lg:sticky lg:top-28">
            <OrderSummary deliveryFee={deliveryFee} />
          </aside>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- field */

const Field = ({
  id, label, value, onChange, error, type = "text", placeholder, required, autoComplete, inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel";
}) => (
  <div>
    <label htmlFor={id} className="field-label">
      {label} {required && <span className="text-basil-300">*</span>}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn("field", error && "border-destructive focus:border-destructive focus:ring-destructive/25")}
    />
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-destructive">
        {error}
      </p>
    )}
  </div>
);

export default CheckoutPage;
