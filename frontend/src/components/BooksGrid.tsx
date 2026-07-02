import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { getBooks } from "@/api/book-api";
import { StateCard, bookGradient, card } from "@/components/ui";

export function BooksGrid() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["books"],
    queryFn: getBooks,
  });

  if (query.isLoading) {
    return <StateCard>{t("common.loading")}</StateCard>;
  }

  if (query.isError) {
    return (
      <StateCard variant="error">
        {t("common.error")}: {(query.error as Error).message}
      </StateCard>
    );
  }

  const books = query.data ?? [];
  if (books.length === 0) {
    return <StateCard>{t("home.empty")}</StateCard>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <Link
          key={book.id}
          to="/books/$bookId"
          params={{ bookId: String(book.id) }}
          className={`group flex flex-col gap-3 ${card} animate-fade-in p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${bookGradient(book.order)} font-display text-lg font-bold text-white shadow-md`}
            >
              {book.order}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {t("book.unit_count", { count: book.unitCount })}
            </span>
          </div>
          <div>
            <h2 className="text-base font-semibold">{book.title}</h2>
            {book.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {book.description}
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{t("book.word_count", { count: book.wordCount })}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-primary transition group-hover:translate-x-0.5">
              {t("common.open")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
