import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { input } from "@/components/ui";

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
      className="order-last flex w-full basis-full items-center gap-2 sm:order-none sm:w-auto sm:max-w-md sm:flex-1 sm:basis-auto"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          className={`${input} rounded-full pl-9`}
          aria-label={t("search.aria")}
        />
      </div>
      <button
        type="submit"
        aria-label={t("search.button")}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition hover:brightness-110 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
