import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/Logo";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/i18n/LanguageProvider";

const AdminLogin = () => {
  const { signIn, isAuthenticated, demoCredentials } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const target = (location.state as { from?: string } | null)?.from ?? "/admin";
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const success = await signIn(email, password);
    setLoading(false);

    if (success) {
      navigate((location.state as { from?: string } | null)?.from ?? "/admin", { replace: true });
    } else {
      setError(t("admin.login.error"));
    }
  };

  return (
    <div className="surface-dark grain relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-16 text-cream-100">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-ember-700/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-basil-600/15 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-cream-100/60 transition-colors hover:text-cream-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Zoi
        </Link>

        <div className="rounded-4xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12" />
            <div>
              <h1 className="font-display text-xl font-extrabold">{t("admin.login.title")}</h1>
              <p className="text-xs text-cream-100/55">{t("admin.login.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="field-label text-cream-100/60">
                {t("admin.login.email")}
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                className="field border-white/15 bg-white/[0.06] text-cream-100 placeholder:text-cream-100/35 focus:border-basil-400 focus:ring-basil-400/25"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="field-label text-cream-100/60">
                {t("admin.login.password")}
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="field border-white/15 bg-white/[0.06] text-cream-100 placeholder:text-cream-100/35 focus:border-basil-400 focus:ring-basil-400/25"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/15 px-4 py-3 text-sm font-medium text-red-300"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Lock />}
              {t("admin.login.submit")}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl bg-white/[0.05] p-4 text-xs text-cream-100/60">
            <p className="font-bold uppercase tracking-wider text-basil-300">{t("admin.login.demo")}</p>
            <p className="mt-2 font-mono">{demoCredentials.email}</p>
            <p className="font-mono">{demoCredentials.password}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
