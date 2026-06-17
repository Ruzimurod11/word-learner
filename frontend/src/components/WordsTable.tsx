import { useCallback, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deleteWord, getUnitWords, updateWord } from "@/api/word-api";
import { useIsAdmin } from "@/lib/auth";
import type { Word } from "@/types/word";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
      className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
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
          <span className="text-zinc-500 dark:text-zinc-400">
            {row.original.order}
          </span>
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
          return <span className="font-medium">{row.original.english}</span>;
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
          return row.original.translation;
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
                  className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {ctx.labels.save}
                </button>
                <button
                  type="button"
                  onClick={ctx.cancelEdit}
                  className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
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
                className="rounded bg-zinc-900 p-1.5 text-white hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => ctx.deleteRow(w)}
                disabled={ctx.isDeleting}
                aria-label={ctx.labels.delete}
                title={ctx.labels.delete}
                className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
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
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("words_table.total_in_unit")}{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{total}</span>{" "}
          {t("words_table.word_unit")}
        </span>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {[5, 10, 20].map((s) => (
              <option key={s} value={s}>
                {s} {t("common.per_page")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {wordsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  {t("common.loading")}
                </td>
              </tr>
            ) : wordsQuery.isError ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-red-600 dark:text-red-400"
                >
                  {(wordsQuery.error as Error).message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  {t("words_table.empty")}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
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
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("common.page")} {page} {t("common.of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("common.previous")}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("common.next")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={t("words_table.delete_title")}
        message={
          <>
            {t("words_table.delete_confirm_prefix")}{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
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
