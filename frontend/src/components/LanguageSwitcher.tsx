import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS, setLang, type Lang } from "@/i18n";

const FLAGS: Record<Lang, string> = {
  uz: "🇺🇿",
  en: "🇺🇸",
  ru: "🇷🇺",
};

const LABELS: Record<Lang, string> = {
  uz: "O'zbekcha",
  en: "English",
  ru: "Русский",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current =
    (i18n.language as Lang) in FLAGS ? (i18n.language as Lang) : "uz";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (lang: Lang) => {
    setLang(lang);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
        title={LABELS[current]}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span className="text-base leading-none">{FLAGS[current]}</span>
        <span className="text-xs font-medium uppercase">{current}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-1 min-w-40 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {SUPPORTED_LANGS.map((lang) => {
            const isActive = lang === current;
            return (
              <li key={lang} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => pick(lang)}
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm " +
                    (isActive
                      ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60")
                  }
                >
                  <span className="text-base leading-none">{FLAGS[lang]}</span>
                  <span>{LABELS[lang]}</span>
                  {isActive && (
                    <span className="ml-auto text-zinc-500 dark:text-zinc-400">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
