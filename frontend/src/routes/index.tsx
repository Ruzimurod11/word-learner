import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    BookOpen,
    FileText,
    GraduationCap,
    Library,
    Plus,
    Sparkles,
} from "lucide-react";
import { getBooks } from "@/api/book-api";
import { BooksGrid } from "@/components/BooksGrid";
import { TopicDialog } from "@/components/TopicDialog";
import { StateCard, bookGradient, btn, card } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import type { BookWithUnits } from "@/types/book";

export const Route = createFileRoute("/")({
    component: HomePage,
});

function HomePage() {
    const { t } = useTranslation();
    return (
        <main className="flex flex-col gap-5 sm:gap-8">
            <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-purple-600 px-5 py-4 text-white shadow-xl shadow-indigo-500/20 sm:rounded-3xl sm:px-10 sm:py-10">
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
                <h2 className="text-xl font-bold sm:text-2xl">
                    {t("home.title")}
                </h2>
                <BooksGrid />
            </div>
            <VocabulariesSection />
            <PassagesSection />
            <TopicsSection />
        </main>
    );
}

function VocabulariesSection() {
    const { t } = useTranslation();
    const query = useQuery({ queryKey: ["books"], queryFn: getBooks });
    const vocab = (query.data ?? []).find((b) => b.kind === "vocabulary");
    const wordCount = vocab?.wordCount ?? 0;

    return (
        <section className="flex flex-col gap-4 border-t border-border pt-6 sm:pt-8">
            <h2 className="text-xl font-bold sm:text-2xl">
                {t("vocab.title")}
            </h2>
            <Link
                to="/vocabulary"
                className={`group flex items-center gap-4 ${card} p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
            >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                    <Library className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">
                        {t("vocab.title")}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {t("vocab.subtitle")}
                    </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
                    <span>{t("book.word_count", { count: wordCount })}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary transition group-hover:translate-x-0.5">
                        {t("common.open")}
                        <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                        />
                    </span>
                </div>
            </Link>
        </section>
    );
}

function TopicsSection() {
    const { t } = useTranslation();
    const isAdmin = useIsAdmin();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const query = useQuery({ queryKey: ["books"], queryFn: getBooks });
    const topics = (query.data ?? []).filter((b) => b.kind === "topic");

    if (!isAdmin && topics.length === 0) return null;

    const onSaved = (book: BookWithUnits): void => {
        void navigate({
            to: "/books/$bookId",
            params: { bookId: String(book.id) },
        });
    };

    return (
        <section className="flex flex-col gap-4 border-t border-border pt-6 sm:pt-8">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold sm:text-2xl">
                        {t("topic.section_title")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("topic.section_subtitle")}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        type="button"
                        className={btn.primary}
                        onClick={() => setOpen(true)}
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("topic.add")}
                    </button>
                )}
            </div>
            {topics.length === 0 ? (
                <StateCard>{t("topic.empty")}</StateCard>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic) => (
                        <Link
                            key={topic.id}
                            to="/books/$bookId"
                            params={{ bookId: String(topic.id) }}
                            className={`group flex flex-col gap-3 ${card} p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${bookGradient(topic.order)} font-display text-lg font-bold text-white shadow-md`}
                                >
                                    {topic.title.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                    {t("book.unit_count", {
                                        count: topic.unitCount,
                                    })}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">
                                    {topic.title}
                                </h3>
                                {topic.description && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {topic.description}
                                    </p>
                                )}
                            </div>
                            <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                                <span>
                                    {t("book.word_count", {
                                        count: topic.wordCount,
                                    })}
                                </span>
                                <span className="inline-flex items-center gap-1 font-semibold text-primary transition group-hover:translate-x-0.5">
                                    {t("common.open")}
                                    <ArrowRight
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            <TopicDialog
                open={open}
                onClose={() => setOpen(false)}
                onSaved={onSaved}
            />
        </section>
    );
}

function PassagesSection() {
    const { t } = useTranslation();
    const query = useQuery({ queryKey: ["books"], queryFn: getBooks });
    const passages = (query.data ?? []).find((b) => b.kind === "passages");
    if (!passages) return null;

    return (
        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:pt-8">
            <h2 className="text-xl font-bold sm:text-2xl">
                {t("passages.title")}
            </h2>
            <Link
                to="/books/$bookId"
                params={{ bookId: String(passages.id) }}
                className={`group flex items-center gap-4 ${card} p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/10`}
            >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-md">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">
                        {t("passages.title")}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {t("passages.subtitle")}
                    </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
                    <span>
                        {t("book.unit_count", { count: passages.unitCount })}
                    </span>
                    <span>
                        {t("book.word_count", { count: passages.wordCount })}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary transition group-hover:translate-x-0.5">
                        {t("common.open")}
                        <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                        />
                    </span>
                </div>
            </Link>
        </div>
    );
}
