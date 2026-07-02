import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminLogin } from "@/components/AdminLogin";
import { GlobalSearch } from "@/components/GlobalSearch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-zinc-900 hover:opacity-80 dark:text-zinc-100"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
              EW
            </span>
            <span>{t("app.name")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
            <Link
              to="/test"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t("test.button")}
            </Link>
            <GlobalSearch />
            <LanguageSwitcher />
            <ThemeToggle />
            <AdminLogin />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
