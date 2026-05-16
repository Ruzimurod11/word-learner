import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBooks } from "@/api/book-api";

export function BooksGrid() {
  const query = useQuery({
    queryKey: ["books"],
    queryFn: getBooks,
  });

  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Yuklanmoqda...
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Xatolik: {(query.error as Error).message}
      </div>
    );
  }

  const books = query.data ?? [];
  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Kitoblar topilmadi. Avval <code className="font-mono text-xs">pnpm db:seed</code> ni ishga tushiring.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <Link
          key={book.id}
          to="/books/$bookId"
          params={{ bookId: String(book.id) }}
          className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white group-hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-zinc-300">
              {book.order}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {book.unitCount} unit
            </span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {book.title}
            </h2>
            {book.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {book.description}
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            <span>{book.wordCount} so'z</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Ochish →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
