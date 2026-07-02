import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
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
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
      >
        <span className="text-base leading-none">{FLAGS[current]}</span>
        <span className="text-xs font-medium uppercase">{current}</span>
        <ChevronDown
          className={
            "h-3.5 w-3.5 transition-transform" + (open ? " rotate-180" : "")
          }
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 min-w-40 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
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
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted")
                  }
                >
                  <span className="text-base leading-none">{FLAGS[lang]}</span>
                  <span>{LABELS[lang]}</span>
                  {isActive && (
                    <Check
                      className="ml-auto h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
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
