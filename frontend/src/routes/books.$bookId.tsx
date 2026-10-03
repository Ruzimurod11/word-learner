import { useMemo, useState } from "react";
import {
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { createTopicUnit, deleteTopic, getBook } from "@/api/book-api";
import { useIsAdmin } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TopicDialog } from "@/components/TopicDialog";
import { UnitCloseButton } from "@/components/UnitCloseButton";
import { UnitTabs } from "@/components/UnitTabs";
import { WordForm } from "@/components/WordForm";
import { WordsTable } from "@/components/WordsTable";
import { StateCard, btn } from "@/components/ui";
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
  const queryClient = useQueryClient();
  const bookIdNum = Number(bookId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const createUnitMutation = useMutation({
    mutationFn: () => createTopicUnit(bookIdNum),
    onSuccess: (unit) => {
      void queryClient.invalidateQueries({ queryKey: ["book", bookIdNum] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      onSelectUnit(unit.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTopic(bookIdNum),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void navigate({ to: "/" });
    },
  });

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

  const isTopic = book.kind === "topic";

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
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {t("book.unit_count", { count: book.unitCount })}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {t("book.word_count", { count: book.wordCount })}
            </span>
            {isAdmin && isTopic && (
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  className={btn.ghost}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  className={btn.danger}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t("common.delete")}
                </button>
              </div>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{activeUnit.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("book.word_count", { count: activeUnit.wordCount })}
              </span>
              {activeUnit.closed && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t("book.unit_closed")}
                </span>
              )}
              {isAdmin && (
                <UnitCloseButton
                  unitId={activeUnitId}
                  closed={activeUnit.closed}
                />
              )}
              {isAdmin && isTopic && (
                <button
                  type="button"
                  className={btn.primary}
                  disabled={createUnitMutation.isPending}
                  onClick={() => createUnitMutation.mutate()}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {createUnitMutation.isPending
                    ? t("topic.creating_unit")
                    : t("topic.new_unit")}
                </button>
              )}
            </div>
          </div>
          {createUnitMutation.isError && (
            <StateCard variant="error">
              {(createUnitMutation.error as Error).message}
            </StateCard>
          )}
          {isAdmin && !activeUnit.closed && (
            <WordForm key={`form-${activeUnitId}`} unitId={activeUnitId} />
          )}
          {isAdmin && activeUnit.closed && (
            <StateCard>{t("book.unit_closed_hint")}</StateCard>
          )}
          <WordsTable key={`table-${activeUnitId}`} unitId={activeUnitId} />
        </div>
      ) : (
        <StateCard>{t("book.no_units")}</StateCard>
      )}

      {isTopic && (
        <TopicDialog
          open={editOpen}
          topic={{
            id: book.id,
            title: book.title,
            description: book.description,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ["book", book.id] });
          }}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        title={t("topic.delete_title")}
        message={t("topic.delete_confirm", { title: book.title })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmLoading={deleteMutation.isPending}
        loadingLabel={t("common.deleting")}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
