import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { SearchResultsTable } from "@/components/SearchResultsTable";

const searchSchema = z.object({
  q: z.string().trim().optional().default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation();
  const { q } = Route.useSearch();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("search.page_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("search.page_subtitle")}
        </p>
      </div>
      <SearchResultsTable query={q} />
    </div>
  );
}
