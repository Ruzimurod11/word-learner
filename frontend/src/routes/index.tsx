import { createFileRoute } from "@tanstack/react-router";
import { BooksGrid } from "@/components/BooksGrid";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Kitoblar</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          7 ta kitob — har birida 30 ta unit, har bir unitda 20 ta so'z. Boshlash uchun kitobni tanlang.
        </p>
      </div>
      <BooksGrid />
    </div>
  );
}
