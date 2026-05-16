import { createFileRoute } from "@tanstack/react-router";
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
  const { q } = Route.useSearch();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Qidiruv natijalari</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Barcha kitoblar va unitlar ichidagi so'zlar bo'yicha qidirish.
        </p>
      </div>
      <SearchResultsTable query={q} />
    </div>
  );
}
