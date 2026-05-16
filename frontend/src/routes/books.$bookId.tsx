import { useMemo } from "react";
import {
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getBook } from "@/api/book-api";
import { UnitTabs } from "@/components/UnitTabs";
import { WordForm } from "@/components/WordForm";
import { WordsTable } from "@/components/WordsTable";

const bookSearchSchema = z.object({
  unit: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/books/$bookId")({
  validateSearch: bookSearchSchema,
  component: BookPage,
});

function BookPage() {
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
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Yuklanmoqda...
      </div>
    );
  }

  if (bookQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Xatolik: {(bookQuery.error as Error).message}
      </div>
    );
  }

  const book = bookQuery.data;
  if (!book) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Kitob topilmadi.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Barcha kitoblar
        </Link>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{book.title}</h1>
            {book.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {book.description}
              </p>
            )}
          </div>
          <div className="hidden text-right text-sm text-zinc-500 dark:text-zinc-400 sm:block">
            <div>{book.unitCount} unit</div>
            <div>{book.wordCount} so'z</div>
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
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {activeUnit.wordCount} so'z
            </span>
          </div>
          <WordForm unitId={activeUnitId} />
          <WordsTable key={activeUnitId} unitId={activeUnitId} />
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Bu kitobda hali unit yo'q.
        </div>
      )}
    </div>
  );
}
