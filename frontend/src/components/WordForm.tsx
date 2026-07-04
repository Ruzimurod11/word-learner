import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Plus } from "lucide-react";
import { createUnitWord } from "@/api/word-api";
import type { CreateWordDto } from "@/types/word";
import { btn, card, errorAlert, input } from "@/components/ui";

interface WordFormProps<R = unknown> {
  // Standart (unit) rejim: unitId beriladi, so'z shu unit'ga qo'shiladi.
  unitId?: number;
  // Muqobil submit (mas. Vocabularies avto-tag): berilsa createUnitWord o'rniga ishlatiladi.
  submitWord?: (data: CreateWordDto) => Promise<R>;
  // Muvaffaqiyatdan keyin qo'shimcha ish (mas. invalidatsiya + navigatsiya).
  onAdded?: (result: R) => void;
}

export function WordForm<R = unknown>({
  unitId,
  submitWord,
  onAdded,
}: WordFormProps<R>) {
  const { t } = useTranslation();
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const englishRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(false), 2500);
    return () => clearTimeout(id);
  }, [success]);

  const mutation = useMutation({
    mutationFn: (): Promise<R> => {
      const payload: CreateWordDto = {
        english: english.trim(),
        translation: translation.trim(),
      };
      if (submitWord) return submitWord(payload);
      return createUnitWord(unitId!, payload) as Promise<R>;
    },
    onSuccess: (result) => {
      setEnglish("");
      setTranslation("");
      setError(null);
      setSuccess(true);
      englishRef.current?.focus();
      if (unitId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: ["unit-words", unitId] });
      }
      void queryClient.invalidateQueries({ queryKey: ["book"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      onAdded?.(result);
    },
    onError: (err: Error) => setError(err.message),
  });

  const canSubmit =
    english.trim().length > 0 &&
    translation.trim().length > 0 &&
    !mutation.isPending;

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!english.trim() || !translation.trim()) {
      setError(t("word_form.both_required"));
      return;
    }
    mutation.mutate();
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-3 ${card} p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
          {t("word_form.title")}
        </h3>
        {success && (
          <span
            role="status"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("word_form.success")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            {t("word_form.english_label")}
          </label>
          <input
            ref={englishRef}
            type="text"
            value={english}
            onChange={(e) => {
              setEnglish(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t("word_form.english_placeholder")}
            className={input}
            disabled={mutation.isPending}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            {t("word_form.translation_label")}
          </label>
          <input
            type="text"
            value={translation}
            onChange={(e) => {
              setTranslation(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t("word_form.translation_placeholder")}
            className={input}
            disabled={mutation.isPending}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`${btn.primary} sm:w-auto`}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("word_form.submitting")}
            </>
          ) : (
            t("word_form.submit")
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className={errorAlert}>
          {error}
        </p>
      )}
    </form>
  );
}
