import { PaymentMethod, PaymentStatus, RestaurantSettings } from "@/types";

/**
 * Payment architecture.
 *
 * The app never "fakes" a production payment. Three provider implementations
 * live behind one interface:
 *
 *   • CashProvider     — real behaviour, settled at handover (status: pending)
 *   • DemoProvider     — development only, every result is flagged `demo: true`
 *   • Stripe / PayPal  — production adapters; they refuse to run until real
 *                        credentials and a server-side intent endpoint exist.
 *
 * Switching to live payments = set `paymentProvider` in the admin settings and
 * implement the two marked TODOs against your backend. No UI change required.
 */

export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  customerName: string;
  customerEmail?: string;
  /** Where the provider should return the customer after an external redirect. */
  returnUrl?: string;
}

export interface PaymentResult {
  status: PaymentStatus;
  provider: string;
  reference?: string;
  /** True whenever the charge did not touch a real payment network. */
  demo: boolean;
  /** Set when a redirect-based provider needs the customer to leave the site. */
  redirectUrl?: string;
  error?: string;
}

export interface PaymentProvider {
  id: string;
  supports(method: PaymentMethod): boolean;
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
}

class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

/** Cash is genuinely settled offline — never marked paid before handover. */
const cashProvider: PaymentProvider = {
  id: "cash",
  supports: (method) => method === "cash",
  async createPayment() {
    return { status: "pending", provider: "cash", demo: false };
  },
};

/**
 * Development stand-in. It simulates network latency and a small failure rate
 * so error states are exercised, and marks every result as demo so the UI can
 * label it and no revenue report mistakes it for a real charge.
 */
const demoProvider: PaymentProvider = {
  id: "demo",
  supports: () => true,
  async createPayment(request) {
    await new Promise((resolve) => setTimeout(resolve, 900));

    // ~6% simulated decline, mirroring how a real gateway behaves.
    if (Math.random() < 0.06) {
      return {
        status: "failed",
        provider: "demo",
        demo: true,
        error: "card_declined",
      };
    }

    return {
      status: "paid",
      provider: "demo",
      demo: true,
      reference: `demo_${request.orderNumber.replace(/\W/g, "").toLowerCase()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };
  },
};

/**
 * Production adapter for Stripe (covers Visa, Mastercard, Amex … through one
 * integration — no per-brand handling). Requires a server endpoint that creates
 * a PaymentIntent; the publishable key alone cannot charge a card.
 */
const stripeProvider: PaymentProvider = {
  id: "stripe",
  supports: (method) => method === "card",
  async createPayment() {
    // TODO(production): POST to /api/payments/stripe/intent, then confirm with
    // @stripe/stripe-js using the returned client_secret.
    throw new PaymentError(
      "Stripe is not configured. Add STRIPE_SECRET_KEY on the server and implement /api/payments/stripe/intent."
    );
  },
};

/** Production adapter for PayPal Orders v2 (redirect / JS SDK approval flow). */
const paypalProvider: PaymentProvider = {
  id: "paypal",
  supports: (method) => method === "paypal",
  async createPayment() {
    // TODO(production): POST to /api/payments/paypal/order and return the
    // approval link so the customer can complete the payment.
    throw new PaymentError(
      "PayPal is not configured. Add PAYPAL_CLIENT_ID/SECRET on the server and implement /api/payments/paypal/order."
    );
  },
};

const productionProviders: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
};

/** Picks the provider that should handle a given method for the current config. */
export const resolveProvider = (
  method: PaymentMethod,
  settings: RestaurantSettings
): PaymentProvider => {
  if (method === "cash") return cashProvider;

  if (settings.paymentProvider === "demo") return demoProvider;

  const configured = productionProviders[settings.paymentProvider];
  if (configured?.supports(method)) return configured;

  // A production provider was chosen but does not handle this method
  // (e.g. Stripe selected while the customer picked PayPal).
  return productionProviders[method === "paypal" ? "paypal" : "stripe"] ?? demoProvider;
};

export const processPayment = async (
  request: PaymentRequest,
  settings: RestaurantSettings
): Promise<PaymentResult> => {
  const provider = resolveProvider(request.method, settings);

  try {
    return await provider.createPayment(request);
  } catch (error) {
    return {
      status: "failed",
      provider: provider.id,
      demo: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/** True while no real gateway is wired up — the UI shows a demo notice then. */
export const isDemoMode = (settings: RestaurantSettings) => settings.paymentProvider === "demo";
