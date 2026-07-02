import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getBook, getBooks } from "@/api/book-api";
import { QuizGame } from "@/components/QuizGame";
import { UnitTabs } from "@/components/UnitTabs";

const testSearchSchema = z.object({
  mode: z.enum(["topic", "general"]).optional(),
  scope: z.enum(["all", "half", "full"]).optional(),
  book: z.coerce.number().int().positive().optional(),
  unit: z.coerce.number().int().positive().optional(),
  fromBook: z.coerce.number().int().positive().optional(),
  fromUnit: z.coerce.number().int().positive().optional(),
  toBook: z.coerce.number().int().positive().optional(),
  toUnit: z.coerce.number().int().positive().optional(),
});

type TestSearch = z.infer<typeof testSearchSchema>;

export const Route = createFileRoute("/test")({
  validateSearch: testSearchSchema,
  component: TestPage,
});

function ChoiceCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </span>
    </button>
  );
}

function TestPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const goTo = (next: TestSearch) => {
    void navigate({ to: "/test", search: next });
  };

  if (search.mode === "general") {
    return <GeneralFlow search={search} goTo={goTo} />;
  }

  if (search.mode === "topic" && search.unit !== undefined) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("test.topic")}</h1>
        <QuizGame
          key={search.unit}
          unitId={search.unit}
          onExit={() => goTo({ mode: "topic", book: search.book })}
        />
      </div>
    );
  }

  if (search.mode === "topic" && search.book !== undefined) {
    return (
      <UnitPicker
        bookId={search.book}
        title={t("test.choose_unit")}
        onSelect={(unitId) =>
          goTo({ mode: "topic", book: search.book, unit: unitId })
        }
        onBack={() => goTo({ mode: "topic" })}
      />
    );
  }

  if (search.mode === "topic") {
    return (
      <BookPicker
        title={t("test.choose_book")}
        onSelect={(bookId) => goTo({ mode: "topic", book: bookId })}
        onBack={() => goTo({})}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("test.title")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChoiceCard
          title={t("test.topic")}
          description={t("test.topic_desc")}
          onClick={() => goTo({ mode: "topic" })}
        />
        <ChoiceCard
          title={t("test.general")}
          description={t("test.general_desc")}
          onClick={() => goTo({ mode: "general" })}
        />
      </div>
    </div>
  );
}

function GeneralFlow({
  search,
  goTo,
}: {
  search: TestSearch;
  goTo: (next: TestSearch) => void;
}) {
  const { t } = useTranslation();

  if (search.scope === "all") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("test.all_words")}</h1>
        <QuizGame
          key="all"
          selectableCount
          onExit={() => goTo({ mode: "general" })}
        />
      </div>
    );
  }

  if (search.scope === "half") {
    if (search.toUnit !== undefined) {
      return (
        <div className="flex flex-col gap-5">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("test.half_manual")}
          </h1>
          <QuizGame
            key={`half-${search.toUnit}`}
            toUnitId={search.toUnit}
            selectableCount
            onExit={() =>
              goTo({ mode: "general", scope: "half", toBook: search.toBook })
            }
          />
        </div>
      );
    }
    if (search.toBook !== undefined) {
      return (
        <UnitPicker
          bookId={search.toBook}
          title={t("test.choose_end_unit")}
          onSelect={(unitId) =>
            goTo({
              mode: "general",
              scope: "half",
              toBook: search.toBook,
              toUnit: unitId,
            })
          }
          onBack={() => goTo({ mode: "general", scope: "half" })}
        />
      );
    }
    return (
      <BookPicker
        title={t("test.choose_end_book")}
        onSelect={(bookId) =>
          goTo({ mode: "general", scope: "half", toBook: bookId })
        }
        onBack={() => goTo({ mode: "general" })}
      />
    );
  }

  if (search.scope === "full") {
    if (search.fromUnit !== undefined && search.toUnit !== undefined) {
      return (
        <div className="flex flex-col gap-5">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("test.full_manual")}
          </h1>
          <QuizGame
            key={`full-${search.fromUnit}-${search.toUnit}`}
            fromUnitId={search.fromUnit}
            toUnitId={search.toUnit}
            selectableCount
            onExit={() =>
              goTo({
                mode: "general",
                scope: "full",
                fromBook: search.fromBook,
                fromUnit: search.fromUnit,
                toBook: search.toBook,
              })
            }
          />
        </div>
      );
    }
    if (search.fromUnit !== undefined && search.toBook !== undefined) {
      return (
        <UnitPicker
          bookId={search.toBook}
          title={t("test.choose_end_unit")}
          onSelect={(unitId) =>
            goTo({
              mode: "general",
              scope: "full",
              fromBook: search.fromBook,
              fromUnit: search.fromUnit,
              toBook: search.toBook,
              toUnit: unitId,
            })
          }
          onBack={() =>
            goTo({
              mode: "general",
              scope: "full",
              fromBook: search.fromBook,
              fromUnit: search.fromUnit,
            })
          }
        />
      );
    }
    if (search.fromUnit !== undefined) {
      return (
        <BookPicker
          title={t("test.choose_end_book")}
          onSelect={(bookId) =>
            goTo({
              mode: "general",
              scope: "full",
              fromBook: search.fromBook,
              fromUnit: search.fromUnit,
              toBook: bookId,
            })
          }
          onBack={() =>
            goTo({ mode: "general", scope: "full", fromBook: search.fromBook })
          }
        />
      );
    }
    if (search.fromBook !== undefined) {
      return (
        <UnitPicker
          bookId={search.fromBook}
          title={t("test.choose_start_unit")}
          onSelect={(unitId) =>
            goTo({
              mode: "general",
              scope: "full",
              fromBook: search.fromBook,
              fromUnit: unitId,
            })
          }
          onBack={() => goTo({ mode: "general", scope: "full" })}
        />
      );
    }
    return (
      <BookPicker
        title={t("test.choose_start_book")}
        onSelect={(bookId) =>
          goTo({ mode: "general", scope: "full", fromBook: bookId })
        }
        onBack={() => goTo({ mode: "general" })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BackButton onClick={() => goTo({})} />
      <h1 className="text-2xl font-bold sm:text-3xl">{t("test.general")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChoiceCard
          title={t("test.all_words")}
          description={t("test.all_words_desc")}
          onClick={() => goTo({ mode: "general", scope: "all" })}
        />
        <ChoiceCard
          title={t("test.half_manual")}
          description={t("test.half_manual_desc")}
          onClick={() => goTo({ mode: "general", scope: "half" })}
        />
        <ChoiceCard
          title={t("test.full_manual")}
          description={t("test.full_manual_desc")}
          onClick={() => goTo({ mode: "general", scope: "full" })}
        />
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      ← {t("test.back")}
    </button>
  );
}

function BookPicker({
  title,
  onSelect,
  onBack,
}: {
  title: string;
  onSelect: (bookId: number) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ["books"], queryFn: getBooks });

  return (
    <div className="flex flex-col gap-5">
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {query.isLoading && (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {t("common.loading")}
        </div>
      )}
      {query.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {t("common.error")}: {(query.error as Error).message}
        </div>
      )}
      {query.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {query.data.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelect(book.id)}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {book.order}
              </span>
              <span className="text-base font-semibold">{book.title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("book.word_count", { count: book.wordCount })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UnitPicker({
  bookId,
  title,
  onSelect,
  onBack,
}: {
  bookId: number;
  title: string;
  onSelect: (unitId: number) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBook(bookId),
  });

  return (
    <div className="flex flex-col gap-5">
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {query.isLoading && (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {t("common.loading")}
        </div>
      )}
      {query.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {t("common.error")}: {(query.error as Error).message}
        </div>
      )}
      {query.data && (
        <UnitTabs
          units={query.data.units}
          activeUnitId={null}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
