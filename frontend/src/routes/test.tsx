import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getBook, getBooks } from "@/api/book-api";
import { Loader } from "@/components/Loader";
import { QuizGame } from "@/components/QuizGame";
import { UnitTabs } from "@/components/UnitTabs";
import { StateCard, bookGradient, card } from "@/components/ui";

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
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-3 ${card} p-6 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
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
          icon={BookOpen}
          onClick={() => goTo({ mode: "topic" })}
        />
        <ChoiceCard
          title={t("test.general")}
          description={t("test.general_desc")}
          icon={Layers}
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
          icon={Sparkles}
          onClick={() => goTo({ mode: "general", scope: "all" })}
        />
        <ChoiceCard
          title={t("test.half_manual")}
          description={t("test.half_manual_desc")}
          icon={SlidersHorizontal}
          onClick={() => goTo({ mode: "general", scope: "half" })}
        />
        <ChoiceCard
          title={t("test.full_manual")}
          description={t("test.full_manual_desc")}
          icon={Settings2}
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
      className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("test.back")}
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
      {query.isLoading && <Loader />}
      {query.isError && (
        <StateCard variant="error">
          {t("common.error")}: {(query.error as Error).message}
        </StateCard>
      )}
      {query.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {query.data
            .filter((book) => book.kind === "essential")
            .map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelect(book.id)}
              className={`flex flex-col gap-2 ${card} p-5 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bookGradient(book.order)} font-display text-base font-bold text-white shadow-md`}
              >
                {book.order}
              </span>
              <span className="text-base font-semibold">{book.title}</span>
              <span className="text-xs text-muted-foreground">
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
      {query.isLoading && <Loader />}
      {query.isError && (
        <StateCard variant="error">
          {t("common.error")}: {(query.error as Error).message}
        </StateCard>
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
