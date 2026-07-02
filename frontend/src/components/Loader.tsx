import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { card } from "@/components/ui";

const PAIRS = [
  { en: "book", uz: "kitob", ru: "книга" },
  { en: "word", uz: "so'z", ru: "слово" },
  { en: "learn", uz: "o'rganmoq", ru: "учиться" },
  { en: "memory", uz: "xotira", ru: "память" },
  { en: "dictionary", uz: "lug'at", ru: "словарь" },
  { en: "knowledge", uz: "bilim", ru: "знание" },
];

function pairAt(i: number) {
  const n = PAIRS.length;
  return PAIRS[((i % n) + n) % n];
}

export function Loader({ label, bare = false }: { label?: string; bare?: boolean }) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), 1400);
    return () => clearInterval(id);
  }, []);

  // Old kartochka juft qadamlarda, orqasi toq qadamlarda ko'rinadi —
  // so'z faqat kartochka yashiringan paytda almashadi.
  const front = pairAt(Math.floor(step / 2));
  const back = pairAt(Math.floor((step - 1) / 2));
  const lang = i18n.language.startsWith("ru") ? "ru" : "uz";

  const content = (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="[perspective:800px]">
        <div
          className="relative h-24 w-44 transition-transform duration-700 ease-in-out [transform-style:preserve-3d]"
          style={{ transform: `rotateY(${step * 180}deg)` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card shadow-lg shadow-indigo-500/10 [backface-visibility:hidden]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              en
            </span>
            <span className="font-display text-xl font-bold text-foreground">
              {front.en}
            </span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {lang}
            </span>
            <span className="font-display text-xl font-bold text-white">
              {back[lang]}
            </span>
          </div>
        </div>
      </div>
      <span className="animate-pulse text-sm text-muted-foreground">
        {label ?? t("common.loading")}
      </span>
    </div>
  );

  if (bare) {
    return content;
  }
  return <div className={`${card} animate-fade-in p-8`}>{content}</div>;
}
