import { useMemo } from "react";
import {
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { getBook } from "@/api/book-api";
import { useIsAdmin } from "@/lib/auth";
import { UnitTabs } from "@/components/UnitTabs";
import { WordForm } from "@/components/WordForm";
import { WordsTable } from "@/components/WordsTable";
import { StateCard } from "@/components/ui";
import { Loader } from "@/components/Loader";

const bookSearchSchema = z.object({
  unit: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/books/$bookId")({
  validateSearch: bookSearchSchema,
  component: BookPage,
});

function BookPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { bookId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const bookIdNum = Number(bookId);

  const bookQuery = useQuery({
    queryKey: ["book", bookIdNum],
    queryFn: () => getBook(bookIdNum),
    enabled: !Number.isNaN(bookIdNum),
  });

  const activeUnitId = useMemo(() => {
    if (!bookQuery.data) return null;
    const units = bookQuery.data.units;
    if (units.length === 0) return null;
    if (search.unit && units.some((u) => u.id === search.unit)) {
      return search.unit;
    }
    return units[0].id;
  }, [bookQuery.data, search.unit]);

  const activeUnit = useMemo(
    () => bookQuery.data?.units.find((u) => u.id === activeUnitId) ?? null,
    [bookQuery.data, activeUnitId],
  );

  const onSelectUnit = (unitId: number) => {
    void navigate({
      to: "/books/$bookId",
      params: { bookId },
      search: { unit: unitId },
      replace: true,
    });
  };

  if (bookQuery.isLoading) {
    return <Loader />;
  }

  if (bookQuery.isError) {
    return (
      <StateCard variant="error">
        {t("common.error")}: {(bookQuery.error as Error).message}
      </StateCard>
    );
  }

  const book = bookQuery.data;
  if (!book) {
    return <StateCard>{t("book.not_found")}</StateCard>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("common.back_to_books")}
        </Link>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{book.title}</h1>
            {book.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {book.description}
              </p>
            )}
          </div>
          <div className="hidden flex-col items-end gap-1.5 sm:flex">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {t("book.unit_count", { count: book.unitCount })}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {t("book.word_count", { count: book.wordCount })}
            </span>
          </div>
        </div>
      </div>

      <UnitTabs
        units={book.units}
        activeUnitId={activeUnitId}
        onSelect={onSelectUnit}
      />

      {activeUnit && activeUnitId != null ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{activeUnit.title}</h2>
            <span className="text-sm text-muted-foreground">
              {t("book.word_count", { count: activeUnit.wordCount })}
            </span>
          </div>
          {isAdmin && (
            <WordForm key={`form-${activeUnitId}`} unitId={activeUnitId} />
          )}
          <WordsTable key={`table-${activeUnitId}`} unitId={activeUnitId} />
        </div>
      ) : (
        <StateCard>{t("book.no_units")}</StateCard>
      )}
    </div>
  );
}
