import { useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import {
  addVocabularyWord,
  getVocabulary,
  type AddVocabularyWordResult,
} from "@/api/vocabulary-api";
import { useIsAdmin } from "@/lib/auth";
import { UnitTabs } from "@/components/UnitTabs";
import { WordForm } from "@/components/WordForm";
import { WordsTable } from "@/components/WordsTable";
import { StateCard } from "@/components/ui";
import { Loader } from "@/components/Loader";

const vocabSearchSchema = z.object({
  unit: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/vocabulary")({
  validateSearch: vocabSearchSchema,
  component: VocabularyPage,
});

function VocabularyPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["vocabulary"], queryFn: getVocabulary });

  const units = useMemo(() => query.data?.units ?? [], [query.data]);

  const activeUnitId = useMemo(() => {
    if (units.length === 0) return null;
    if (search.unit && units.some((u) => u.id === search.unit)) {
      return search.unit;
    }
    // Standart: oxirgi (joriy to'lib borayotgan) bo'lim
    return units[units.length - 1].id;
  }, [units, search.unit]);

  const activeUnit = useMemo(
    () => units.find((u) => u.id === activeUnitId) ?? null,
    [units, activeUnitId],
  );

  const onSelectUnit = (unitId: number) => {
    void navigate({
      to: "/vocabulary",
      search: { unit: unitId },
      replace: true,
    });
  };

  const onAdded = (result: AddVocabularyWordResult) => {
    void queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    void queryClient.invalidateQueries({
      queryKey: ["unit-words", result.unit.id],
    });
    // So'z yangi bo'limga tushgan bo'lsa — o'sha bo'limga o'tamiz
    if (result.unit.id !== activeUnitId) {
      void navigate({
        to: "/vocabulary",
        search: { unit: result.unit.id },
        replace: true,
      });
    }
  };

  if (query.isLoading) {
    return <Loader />;
  }

  if (query.isError) {
    return (
      <StateCard variant="error">
        {t("common.error")}: {(query.error as Error).message}
      </StateCard>
    );
  }

  const book = query.data;

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
            <h1 className="text-2xl font-bold sm:text-3xl">{t("vocab.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("vocab.subtitle")}
            </p>
          </div>
          {book && (
            <div className="hidden flex-col items-end gap-1.5 sm:flex">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {t("vocab.part_count", { count: book.unitCount })}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {t("book.word_count", { count: book.wordCount })}
              </span>
            </div>
          )}
        </div>
      </div>

      {units.length > 0 && (
        <UnitTabs
          units={units}
          activeUnitId={activeUnitId}
          onSelect={onSelectUnit}
        />
      )}

      {isAdmin && (
        <WordForm
          submitWord={addVocabularyWord}
          onAdded={onAdded}
        />
      )}

      {activeUnit && activeUnitId != null ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {t("vocab.part", { n: activeUnit.order })}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t("book.word_count", { count: activeUnit.wordCount })}
            </span>
          </div>
          <WordsTable key={`vocab-${activeUnitId}`} unitId={activeUnitId} />
        </div>
      ) : (
        <StateCard>{t("vocab.empty")}</StateCard>
      )}
    </div>
  );
}
