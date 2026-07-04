import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { AdminLogin } from "@/components/AdminLogin";
import { GlobalSearch } from "@/components/GlobalSearch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TranscriptionBackfill } from "@/components/TranscriptionBackfill";
import { btn } from "@/components/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold hover:opacity-80"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display">{t("app.name")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
            <Link
              to="/test"
              className={`${btn.ghost} mr-auto h-9 shrink-0 sm:mr-0`}
              activeProps={{
                className: `${btn.ghost} mr-auto h-9 shrink-0 border-primary/50 bg-primary/10 text-primary sm:mr-0`,
              }}
            >
              {t("test.button")}
            </Link>
            <GlobalSearch />
            <TranscriptionBackfill />
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
