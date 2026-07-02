import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { BooksGrid } from "@/components/BooksGrid";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-6 py-10 text-white shadow-xl shadow-indigo-500/20 sm:px-10">
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
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {t("home.hero_title")}
            </h1>
            <p className="mt-2 text-white/85">{t("home.subtitle")}</p>
            <Link
              to="/test"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-lg transition hover:scale-[1.03]"
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
    </div>
  );
}
