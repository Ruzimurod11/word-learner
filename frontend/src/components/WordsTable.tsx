import { useCallback, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteWord, getWords, updateWord } from "@/api/word-api";
import type { Word } from "@/types/word";

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
  rowOffset: number;
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

export function WordsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const englishRef = useRef("");
  const translationRef = useRef("");
  const queryClient = useQueryClient();

  const wordsQuery = useQuery({
    queryKey: ["words", { page, pageSize, search }],
    queryFn: () => getWords({ page, pageSize, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWord(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["words"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; english: string; translation: string }) =>
      updateWord(vars.id, {
        english: vars.english.trim(),
        translation: vars.translation.trim(),
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["words"] });
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

  const deleteRow = useCallback(
    (w: Word) => {
      if (confirm(`"${w.english}" so'zini o'chirishni xohlaysizmi?`)) {
        deleteMutation.mutate(w.id);
      }
    },
    [deleteMutation],
  );

  const columns = useMemo<ColumnDef<Word>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          return (
            <span className="text-zinc-500 dark:text-zinc-400">
              {ctx.rowOffset + row.index + 1}
            </span>
          );
        },
        size: 60,
      },
      {
        accessorKey: "english",
        header: "English",
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
        header: "Tarjima",
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
      {
        id: "actions",
        header: () => <div className="text-right">Amal</div>,
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
                  Saqlash
                </button>
                <button
                  type="button"
                  onClick={ctx.cancelEdit}
                  className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                >
                  Bekor
                </button>
              </div>
            );
          }
          return (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => ctx.startEdit(w)}
                aria-label="Tahrirlash"
                title="Tahrirlash"
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
                aria-label="O'chirish"
                title="O'chirish"
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
      },
    ],
    [],
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
    rowOffset: (page - 1) * pageSize,
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
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Qidiruv (english yoki tarjima)..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Jami: {total}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / sahifa
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
                  Yuklanmoqda...
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
                  Hozircha so'z yo'q. Yuqoridan qo'shing.
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
          Sahifa {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Oldingi
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}
