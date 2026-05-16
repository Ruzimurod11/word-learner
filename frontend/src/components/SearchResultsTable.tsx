import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchWords } from "@/api/word-api";

interface SearchResultsTableProps {
  query: string;
}

export function SearchResultsTable({ query }: SearchResultsTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const results = useQuery({
    queryKey: ["search-words", query, { page, pageSize }],
    queryFn: () => searchWords({ q: query, page, pageSize }),
    enabled: query.length > 0,
    placeholderData: (prev) => prev,
  });

  if (!query) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Qidiruv so'rovi kiritilmagan.
      </div>
    );
  }

  if (results.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Qidirilmoqda...
      </div>
    );
  }

  if (results.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Xatolik: {(results.error as Error).message}
      </div>
    );
  }

  const items = results.data?.items ?? [];
  const total = results.data?.total ?? 0;
  const totalPages = results.data?.totalPages ?? 1;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          "{query}"
        </span>{" "}
        bo'yicha hech narsa topilmadi.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {total}
        </span>{" "}
        ta natija topildi —{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          "{query}"
        </span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Joylashuv
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                English
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Tarjima
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Amal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-2 align-middle">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Book {item.bookOrder} · Unit {item.unitOrder}
                  </span>
                </td>
                <td className="px-4 py-2 align-middle font-medium">
                  {item.english}
                </td>
                <td className="px-4 py-2 align-middle">{item.translation}</td>
                <td className="px-4 py-2 text-right align-middle">
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: String(item.bookId) }}
                    search={{ unit: item.unitId }}
                    className="text-xs font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    Ochish →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Sahifa {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || results.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Oldingi
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || results.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}
