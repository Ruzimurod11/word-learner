import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, GripVertical, Pencil, Trash2 } from "lucide-react";
import { deleteWord, getUnitWords, reorderUnitWords, updateWord } from "@/api/word-api";
import { useIsAdmin } from "@/lib/auth";
import type { PaginatedWords, Word } from "@/types/word";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Select } from "@/components/Select";
import { btn, input } from "@/components/ui";
import { Loader } from "@/components/Loader";

interface TableCtx {
  editingId: number | null;
  startEdit: (w: Word) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  deleteRow: (w: Word) => void;
  setEnglishValue: (v: string) => void;
  setTranslationValue: (v: string) => void;
  setTranscriptionValue: (v: string) => void;
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

function RowDragHandleCell({ rowId, label }: { rowId: string; label: string }) {
  const { attributes, listeners } = useSortable({ id: rowId });
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="cursor-grab touch-none rounded p-1 text-muted-foreground transition hover:bg-muted active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function SortableRow({ row }: { row: Row<Word> }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(row.original.id),
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors hover:bg-primary/5 ${
        isDragging ? "relative z-10 bg-card shadow-lg" : ""
      }`}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-0.5 py-2 align-middle sm:px-4">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
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
  const transcriptionRef = useRef("");
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
    mutationFn: (vars: {
      id: number;
      english: string;
      translation: string;
      transcription: string;
    }) =>
      updateWord(vars.id, {
        english: vars.english.trim(),
        translation: vars.translation.trim(),
        transcription: vars.transcription.trim() || null,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: number[]) => reorderUnitWords(unitId, orderedIds),
    onMutate: async (orderedIds) => {
      const key = ["unit-words", unitId, { page, pageSize }] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaginatedWords>(key);
      if (previous) {
        const byId = new Map(previous.items.map((w) => [w.id, w]));
        const slots = previous.items.map((w) => w.order).sort((a, b) => a - b);
        const items = orderedIds
          .map((id, i) => {
            const w = byId.get(id);
            return w ? { ...w, order: slots[i] } : null;
          })
          .filter((w): w is Word => w !== null);
        queryClient.setQueryData<PaginatedWords>(key, { ...previous, items });
      }
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => invalidate(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const startEdit = useCallback((w: Word) => {
    englishRef.current = w.english;
    translationRef.current = w.translation;
    transcriptionRef.current = w.transcription ?? "";
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
        transcription: transcriptionRef.current,
      });
      return id;
    });
  }, [updateMutation]);

  const deleteRow = useCallback((w: Word) => {
    setConfirmTarget(w);
  }, []);

  const columns = useMemo<ColumnDef<Word>[]>(
    () => [
      ...(isAdmin
        ? [{
        id: "drag",
        header: () => null,
        cell: ({ row }) => (
          <RowDragHandleCell
            rowId={String(row.original.id)}
            label={t("words_table.reorder")}
          />
        ),
        size: 40,
      } as ColumnDef<Word>]
        : []),
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
        accessorKey: "transcription",
        header: () => (
          <>
            <span className="sm:hidden">t</span>
            <span className="hidden sm:inline">
              {t("words_table.header_transcription")}
            </span>
          </>
        ),
        cell: ({ row, table }) => {
          const ctx = table.options.meta as TableCtx;
          if (ctx.editingId === row.original.id) {
            return (
              <EditableInput
                initialValue={row.original.transcription ?? ""}
                onChange={ctx.setTranscriptionValue}
              />
            );
          }
          return row.original.transcription ? (
            <span className="text-lg text-muted-foreground">
              [{row.original.transcription}]
            </span>
          ) : null;
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
  const rowIds = useMemo(() => data.map((w) => String(w.id)), [data]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rowIds.indexOf(String(active.id));
    const newIndex = rowIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const orderedIds = arrayMove(
      data.map((w) => w.id),
      oldIndex,
      newIndex,
    );
    reorderMutation.mutate(orderedIds);
  };

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
    setTranscriptionValue: (v) => {
      transcriptionRef.current = v;
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
    getRowId: (row) => String(row.id),
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
          <Select
            value={pageSize}
            options={[5, 10, 20].map((s) => ({
              value: s,
              label: `${s} ${t("common.per_page")}`,
            }))}
            onChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            ariaLabel={t("common.per_page")}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-0.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4"
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
                <td colSpan={columns.length} className="px-4 py-8">
                  <Loader bare />
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
              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.map((row) => (
                  <SortableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            )}
          </tbody>
          </table>
        </DndContext>
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
