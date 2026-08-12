import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard, ReceiptText, UtensilsCrossed, Tags, Bike,
  Clock, TrendingUp, Settings, LogOut, Menu, X, ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AdminStatsBar } from "./AdminStatsBar";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: TranslationKey; icon: typeof LayoutDashboard; end?: boolean }[] = [
  { to: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "admin.nav.orders", icon: ReceiptText },
  { to: "/admin/menu", label: "admin.nav.menu", icon: UtensilsCrossed },
  { to: "/admin/categories", label: "admin.nav.categories", icon: Tags },
  { to: "/admin/delivery", label: "admin.nav.delivery", icon: Bike },
  { to: "/admin/hours", label: "admin.nav.hours", icon: Clock },
  { to: "/admin/sales", label: "admin.nav.sales", icon: TrendingUp },
  { to: "/admin/settings", label: "admin.nav.settings", icon: Settings },
];

/** Protected shell for the restaurant back office. */
export const AdminLayout = () => {
  const { isAuthenticated, signOut, session } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <LogoMark className="h-9 w-9 rounded-xl" />
        <span className="font-display text-lg font-extrabold">Zoi</span>
        <span className="ml-auto rounded-full bg-sidebar-accent px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-sidebar-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {t(label)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("admin.viewSite")}
        </a>

        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            {session?.name?.slice(0, 2).toUpperCase() ?? "CW"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{session?.name}</p>
            <p className="truncate text-[0.65rem] text-sidebar-foreground/50">{session?.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label={t("admin.logout")}
            className="rounded-lg p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="relative h-full w-72 shadow-lift"
            >
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.openMenu")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.06] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="font-display text-base font-bold sm:hidden">Zoi</span>

          {/* live pulse of the restaurant, flexing into the free space */}
          <AdminStatsBar className="hidden flex-1 sm:block" />

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:ml-0">
            <LanguageSwitcher layoutId="language-pill-admin" />
          </div>
        </header>

        {/*
          Every admin block (PageHeader, Panel, StatCard) carries the shared
          `adminItem` variants, so keying this wrapper on the route replays a
          staggered entrance for the whole page on each navigation.
        */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {reduced ? (
            <Outlet />
          ) : (
            <motion.div
              key={location.pathname}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
              }}
            >
              <Outlet />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};
