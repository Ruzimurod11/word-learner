import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BooksGrid } from "@/components/BooksGrid";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("home.title")}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("home.subtitle")}
        </p>
      </div>
      <BooksGrid />
    </div>
  );
}
