import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWord } from "@/api/word-api";

export function WordForm() {
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createWord({ english: english.trim(), translation: translation.trim() }),
    onSuccess: () => {
      setEnglish("");
      setTranslation("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["words"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!english.trim() || !translation.trim()) {
      setError("Ikkala maydon ham to'ldirilishi kerak");
      return;
    }
    mutation.mutate();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          English
        </label>
        <input
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="apple"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
          disabled={mutation.isPending}
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tarjima
        </label>
        <input
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="olma"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
          disabled={mutation.isPending}
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
      >
        {mutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 sm:absolute sm:mt-16">
          {error}
        </p>
      )}
    </form>
  );
}
