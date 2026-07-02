import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string };
  const [value, setValue] = useState(search.q ?? "");

  const submit = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    void navigate({ to: "/search", search: { q: trimmed } });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setValue("");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="order-last flex w-full basis-full flex-col gap-2 sm:order-none sm:w-auto sm:max-w-md sm:flex-1 sm:basis-auto sm:flex-row sm:items-center"
    >
      <div className="relative w-full sm:flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-8 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
          aria-label={t("search.aria")}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {t("search.button")}
      </button>
    </form>
  );
}
