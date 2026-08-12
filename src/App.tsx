import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { LanguageProvider } from "@/i18n/LanguageProvider";
import { StoreProvider } from "@/context/StoreProvider";
import { CartProvider } from "@/context/CartProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { ProductModalProvider } from "@/context/ProductModalProvider";

import { SiteLayout } from "@/components/layout/SiteLayout";

import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import NotFound from "./pages/NotFound";

// The back office (and its charting library) only loads for staff
const AdminLayout = lazy(() =>
  import("@/components/admin/AdminLayout").then((module) => ({ default: module.AdminLayout }))
);
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminMenu = lazy(() => import("./pages/admin/AdminMenu"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminHours = lazy(() => import("./pages/admin/AdminHours"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

/** Neutral placeholder while a lazy admin screen streams in. */
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted/40 p-8">
    <div className="skeleton h-40 w-full max-w-3xl rounded-3xl" />
  </div>
);

const App = () => (
  <LanguageProvider>
    <StoreProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ProductModalProvider>
              <Routes>
                {/* customer facing */}
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:orderNumber" element={<OrderConfirmationPage />} />
                </Route>

                {/* restaurant back office */}
                <Route
                  path="/admin/login"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <AdminLogin />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="menu" element={<AdminMenu />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="delivery" element={<AdminDelivery />} />
                  <Route path="hours" element={<AdminHours />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster
                position="top-center"
                offset={88}
                toastOptions={{
                  classNames: {
                    toast:
                      "!rounded-2xl !border !border-border !bg-card !text-card-foreground !shadow-lift !font-sans",
                    title: "!font-bold",
                    description: "!text-muted-foreground",
                  },
                }}
              />
            </ProductModalProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </StoreProvider>
  </LanguageProvider>
);

export default App;
