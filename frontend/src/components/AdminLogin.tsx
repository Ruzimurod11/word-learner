import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Lock, LockOpen } from "lucide-react";
import { login as loginRequest } from "@/api/auth-api";
import { clearToken, setToken, useIsAdmin } from "@/lib/auth";
import { btn, errorAlert, input, modalOverlay, modalPanel } from "@/components/ui";

export function AdminLogin() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (isAdmin) {
    return (
      <button
        type="button"
        onClick={() => clearToken()}
        aria-label={t("admin.logout")}
        title={t("admin.logout")}
        className={btn.icon}
      >
        <LockOpen className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await loginRequest(password);
      setToken(token);
      setOpen(false);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const close = (): void => {
    setOpen(false);
    setPassword("");
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("admin.login")}
        title={t("admin.login")}
        className={btn.icon}
      >
        <Lock className="h-5 w-5" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
          <div className={modalOverlay} onClick={close} aria-hidden="true" />
          <div className={modalPanel}>
            <h2
              id="admin-login-title"
              className="text-base font-semibold"
            >
              {t("admin.title")}
            </h2>
            <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("admin.password_placeholder")}
                className={input}
                disabled={loading}
              />
              {error && (
                <p role="alert" className={errorAlert}>
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className={btn.ghost}>
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  className={btn.primary}
                >
                  {loading ? t("admin.submitting") : t("admin.submit")}
                </button>
              </div>
            </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
