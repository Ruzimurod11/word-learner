import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { searchWords } from "@/api/word-api";
import { StateCard, btn } from "@/components/ui";

interface SearchResultsTableProps {
  query: string;
}

export function SearchResultsTable({ query }: SearchResultsTableProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const results = useQuery({
    queryKey: ["search-words", query, { page, pageSize }],
    queryFn: () => searchWords({ q: query, page, pageSize }),
    enabled: query.length > 0,
    placeholderData: (prev) => prev,
  });

  if (!query) {
    return <StateCard>{t("search.empty_query")}</StateCard>;
  }

  if (results.isLoading) {
    return <StateCard>{t("search.searching")}</StateCard>;
  }

  if (results.isError) {
    return (
      <StateCard variant="error">
        {t("common.error")}: {(results.error as Error).message}
      </StateCard>
    );
  }

  const items = results.data?.items ?? [];
  const total = results.data?.total ?? 0;
  const totalPages = results.data?.totalPages ?? 1;

  if (items.length === 0) {
    return (
      <StateCard>
        {t("search.no_results_prefix")}{" "}
        <span className="font-medium text-foreground">"{query}"</span>
        {t("search.no_results_suffix")}
      </StateCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("search.results_found", { count: total })}{" "}
        <span className="font-medium text-foreground">"{query}"</span>
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("search.col_location")}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("search.col_english")}
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("search.col_translation")}
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("search.col_actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-primary/5">
                <td className="px-4 py-2 align-middle">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t("search.location_badge", {
                      book: item.bookOrder,
                      unit: item.unitOrder,
                    })}
                  </span>
                </td>
                <td className="px-4 py-2 align-middle text-lg font-medium">
                  {item.english}
                </td>
                <td className="px-4 py-2 align-middle text-lg">{item.translation}</td>
                <td className="px-4 py-2 text-right align-middle">
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: String(item.bookId) }}
                    search={{ unit: item.unitId }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t("common.open")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span className="text-sm text-muted-foreground">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || results.isFetching}
            className={btn.ghost}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t("common.previous")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || results.isFetching}
            className={btn.ghost}
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
