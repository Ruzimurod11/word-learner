import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createTopic, updateTopic } from "@/api/book-api";
import type { BookWithUnits } from "@/types/book";
import { btn, errorAlert, input, modalOverlay, modalPanel } from "@/components/ui";

interface TopicTarget {
  id: number;
  title: string;
  description: string | null;
}

interface TopicDialogProps {
  open: boolean;
  topic?: TopicTarget;
  onClose: () => void;
  onSaved: (book: BookWithUnits) => void;
}

export function TopicDialog({ open, topic, onClose, onSaved }: TopicDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <TopicDialogForm
      key={topic?.id ?? "new"}
      topic={topic}
      onClose={onClose}
      onSaved={onSaved}
    />,
    document.body,
  );
}

function TopicDialogForm({
  topic,
  onClose,
  onSaved,
}: {
  topic?: TopicTarget;
  onClose: () => void;
  onSaved: (book: BookWithUnits) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(topic?.title ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        title: title.trim(),
        description: description.trim() || null,
      };
      return topic ? updateTopic(topic.id, input) : createTopic(input);
    },
    onSuccess: (book) => {
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["book", book.id] });
      onSaved(book);
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("topic.title_required"));
      return;
    }
    mutation.mutate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className={modalOverlay} onClick={onClose} aria-hidden="true" />
      <div className={modalPanel}>
        <h2 id="topic-dialog-title" className="text-base font-semibold">
          {topic ? t("topic.edit_title") : t("topic.add_title")}
        </h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("topic.name_label")}</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t("topic.name_placeholder")}
              className={input}
              disabled={mutation.isPending}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("topic.description_label")}</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("topic.description_placeholder")}
              className={input}
              disabled={mutation.isPending}
            />
          </label>
          {error && (
            <p role="alert" className={errorAlert}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !title.trim()}
              className={btn.primary}
            >
              {mutation.isPending ? t("topic.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
