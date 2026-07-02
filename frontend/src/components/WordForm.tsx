import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createUnitWord } from "@/api/word-api";
import { btn, card, errorAlert, input } from "@/components/ui";

interface WordFormProps {
  unitId: number;
}

export function WordForm({ unitId }: WordFormProps) {
  const { t } = useTranslation();
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createUnitWord(unitId, {
        english: english.trim(),
        translation: translation.trim(),
      }),
    onSuccess: () => {
      setEnglish("");
      setTranslation("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["unit-words", unitId] });
      void queryClient.invalidateQueries({ queryKey: ["book"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err: Error) => setError(err.message),
  });

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            {t("word_form.english_label")}
          </label>
          <input
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
          disabled={mutation.isPending}
          className={`${btn.primary} sm:w-auto`}
        >
          {mutation.isPending ? t("word_form.submitting") : t("word_form.submit")}
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
