import { createFileRoute } from "@tanstack/react-router";
import { WordForm } from "@/components/WordForm";
import { WordsTable } from "@/components/WordsTable";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  component: VocabularyPage,
});

function VocabularyPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Vocabulary</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Inglizcha so'zlar va tarjimasi. Qo'shing, tahrirlang, o'chiring.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <WordForm />
      <WordsTable />
    </div>
  );
}
