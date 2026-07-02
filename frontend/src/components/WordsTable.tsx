import { useCallback, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { deleteWord, getUnitWords, updateWord } from "@/api/word-api";
import { useIsAdmin } from "@/lib/auth";
import type { Word } from "@/types/word";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { btn, input } from "@/components/ui";

interface TableCtx {
  editingId: number | null;
  startEdit: (w: Word) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  deleteRow: (w: Word) => void;
  setEnglishValue: (v: string) => void;
  setTranslationValue: (v: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  labels: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
  };
}

function EditableInput({
  initialValue,
  onChange,
  autoFocus,
}: {
  initialValue: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e.target.value);
      }}
      className={`${input} px-2 py-1`}
    />
  );
}

interface WordsTableProps {
  unitId: number;
}

export function WordsTable({ unitId }: WordsTableProps) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Word | null>(null);
  const englishRef = useRef("");
  const translationRef = useRef("");
  const queryClient = useQueryClient();

  const wordsQuery = useQuery({
    queryKey: ["unit-words", unitId, { page, pageSize }],
    queryFn: () => getUnitWords(unitId, { page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["unit-words", unitId] });
    void queryClient.invalidateQueries({ queryKey: ["book"] });
    void queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWord(id),
    onSuccess: () => {
      setConfirmTarget(null);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; english: string; translation: string }) =>
      updateWord(vars.id, {
        english: vars.english.trim(),
        translation: vars.translation.trim(),
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const startEdit = useCallback((w: Word) => {
    englishRef.current = w.english;
    translationRef.current = w.translation;
    setEditingId(w.id);
  }, []);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  const saveEdit = useCallback(() => {
    setEditingId((id) => {
      if (id == null) return id;
      updateMutation.mutate({
        id,
        english: englishRef.current,
        translation: translationRef.current,
      });
      return id;
    });
  }, [updateMutation]);

  const deleteRow = useCallback((w: Word) => {
    setConfirmTarget(w);
  }, []);

  const columns = useMemo<ColumnDef<Word>[]>(
    () => [
      {
        id: "rowNumber",
        header: t("words_table.header_num"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.order}</span>
        ),
        size: 60,
      },
      {
        accessorKey: "english",
        header: t("words_table.header_english"),
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          if (ctx.editingId === row.original.id) {
            return (
              <EditableInput
                initialValue={row.original.english}
                onChange={ctx.setEnglishValue}
                autoFocus
              />
            );
          }
          return <span className="text-lg font-medium">{row.original.english}</span>;
        },
      },
      {
        accessorKey: "translation",
        header: t("words_table.header_translation"),
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          if (ctx.editingId === row.original.id) {
            return (
              <EditableInput
                initialValue={row.original.translation}
                onChange={ctx.setTranslationValue}
              />
            );
          }
          return <span className="text-lg">{row.original.translation}</span>;
        },
      },
      ...(isAdmin
        ? [{
        id: "actions",
        header: () => <div className="text-right">{t("words_table.header_actions")}</div>,
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          const w = row.original;
          if (ctx.editingId === w.id) {
            return (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={ctx.saveEdit}
                  disabled={ctx.isSaving}
                  className="rounded-lg bg-success px-2 py-1 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {ctx.labels.save}
                </button>
                <button
                  type="button"
                  onClick={ctx.cancelEdit}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium transition hover:bg-muted"
                >
                  {ctx.labels.cancel}
                </button>
              </div>
            );
          }
          return (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => ctx.startEdit(w)}
                aria-label={ctx.labels.edit}
                title={ctx.labels.edit}
                className="rounded-lg bg-primary/10 p-1.5 text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => ctx.deleteRow(w)}
                disabled={ctx.isDeleting}
                aria-label={ctx.labels.delete}
                title={ctx.labels.delete}
                className="rounded-lg bg-destructive/10 p-1.5 text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        },
      } as ColumnDef<Word>]
        : []),
    ],
    [t, isAdmin],
  );

  const data = wordsQuery.data?.items ?? [];
  const total = wordsQuery.data?.total ?? 0;
  const totalPages = wordsQuery.data?.totalPages ?? 1;

  const tableCtx: TableCtx = {
    editingId,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteRow,
    setEnglishValue: (v) => {
      englishRef.current = v;
    },
    setTranslationValue: (v) => {
      translationRef.current = v;
    },
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    labels: {
      save: t("common.save"),
      cancel: t("common.cancel"),
      edit: t("common.edit"),
      delete: t("common.delete"),
    },
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    meta: tableCtx,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {t("words_table.total_in_unit")}{" "}
          <span className="font-semibold text-foreground">{total}</span>{" "}
          {t("words_table.word_unit")}
        </span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-input bg-card px-2 py-1 text-foreground outline-none transition focus:border-primary"
          >
            {[5, 10, 20].map((s) => (
              <option key={s} value={s}>
                {s} {t("common.per_page")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {wordsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  {t("common.loading")}
                </td>
              </tr>
            ) : wordsQuery.isError ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-destructive"
                >
                  {(wordsQuery.error as Error).message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  {t("words_table.empty")}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-primary/5">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span className="text-sm text-muted-foreground">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || wordsQuery.isFetching}
            className={btn.ghost}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t("common.previous")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || wordsQuery.isFetching}
            className={btn.ghost}
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={t("words_table.delete_title")}
        message={
          <>
            {t("words_table.delete_confirm_prefix")}{" "}
            <span className="font-medium text-foreground">
              "{confirmTarget?.english}"
            </span>{" "}
            {t("words_table.delete_confirm_suffix")}
          </>
        }
        confirmLabel={t("words_table.delete_button")}
        cancelLabel={t("common.cancel")}
        confirmLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (confirmTarget) deleteMutation.mutate(confirmTarget.id);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
