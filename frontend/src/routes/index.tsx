import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Library,
  Sparkles,
} from "lucide-react";
import { getBooks } from "@/api/book-api";
import { BooksGrid } from "@/components/BooksGrid";
import { card } from "@/components/ui";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-5 py-4 text-white shadow-xl shadow-indigo-500/20 sm:rounded-3xl sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="font-display text-xl font-bold sm:text-4xl">
              {t("home.hero_title")}
            </h1>
            <p className="mt-1 text-sm text-white/85 sm:mt-2 sm:text-base">
              {t("home.subtitle")}
            </p>
            <Link
              to="/test"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-lg transition hover:scale-[1.03] sm:mt-6 sm:px-5 sm:py-2.5"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("home.hero_cta")}
            </Link>
          </div>
          <div
            className="relative mr-4 hidden shrink-0 sm:block lg:mr-8"
            aria-hidden="true"
          >
            <div className="flex h-36 w-36 rotate-6 items-center justify-center rounded-3xl bg-white/15 shadow-2xl ring-1 ring-white/30 backdrop-blur-sm lg:h-44 lg:w-44">
              <GraduationCap className="h-16 w-16 text-white drop-shadow-lg lg:h-20 lg:w-20" />
            </div>
            <div className="absolute -bottom-4 -left-7 flex h-16 w-16 -rotate-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">{t("home.title")}</h2>
        <BooksGrid />
      </div>
      <VocabulariesSection />
    </div>
  );
}

function VocabulariesSection() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ["books"], queryFn: getBooks });
  const vocab = (query.data ?? []).find((b) => b.kind === "vocabulary");
  const wordCount = vocab?.wordCount ?? 0;

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:pt-8">
      <h2 className="text-xl font-bold sm:text-2xl">{t("vocab.title")}</h2>
      <Link
        to="/vocabulary"
        className={`group flex items-center gap-4 ${card} p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
      >
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
          <Library className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{t("vocab.title")}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {t("vocab.subtitle")}
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
          <span>{t("book.word_count", { count: wordCount })}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary transition group-hover:translate-x-0.5">
            {t("common.open")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </div>
  );
}
