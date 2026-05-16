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
      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
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
            <span className="text-zinc-500">{ctx.rowOffset + row.index + 1}</span>
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
        header: "Amal",
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          const w = row.original;
          if (ctx.editingId === w.id) {
            return (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={ctx.saveEdit}
                  disabled={ctx.isSaving}
                  className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Saqlash
                </button>
                <button
                  type="button"
                  onClick={ctx.cancelEdit}
                  className="rounded bg-zinc-200 px-2 py-1 text-xs hover:bg-zinc-300"
                >
                  Bekor
                </button>
              </div>
            );
          }
          return (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ctx.startEdit(w)}
                className="rounded bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-800"
              >
                Tahrirlash
              </button>
              <button
                type="button"
                onClick={() => ctx.deleteRow(w)}
                disabled={ctx.isDeleting}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                O'chirish
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
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span>Jami: {total}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-zinc-300 px-2 py-1"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / sahifa
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {wordsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-500"
                >
                  Yuklanmoqda...
                </td>
              </tr>
            ) : wordsQuery.isError ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-red-600"
                >
                  {(wordsQuery.error as Error).message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-500"
                >
                  Hozircha so'z yo'q. Yuqoridan qo'shing.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50">
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
        <span className="text-sm text-zinc-600">
          Sahifa {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:opacity-50"
          >
            Oldingi
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || wordsQuery.isFetching}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:opacity-50"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}
