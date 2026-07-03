import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { getBooks } from "@/api/book-api";
import { getQuiz } from "@/api/word-api";
import type { QuizDirection, QuizQuestion } from "@/types/word";
import {
  CHEER_TIER_VARIANTS,
  MIN_COUNT,
  STREAK_CHEER_VARIANTS,
  getQuizCheer,
  getQuizFeedbackTier,
  isValidQuizCount,
  scoreQuiz,
} from "@/lib/quiz";
import type { QuizCheer, QuizCheerTier, QuizFeedbackTier } from "@/lib/quiz";
import { StateCard, btn, card, input } from "@/components/ui";
import { Loader } from "@/components/Loader";

const FEEDBACK_STYLES: Record<
  QuizFeedbackTier,
  { emoji: string; gradient: string }
> = {
  perfect: { emoji: "👑", gradient: "from-amber-500 to-yellow-500" },
  excellent: { emoji: "🚀", gradient: "from-emerald-500 to-teal-500" },
  great: { emoji: "🔥", gradient: "from-indigo-500 to-violet-500" },
  good: { emoji: "💪", gradient: "from-sky-500 to-blue-500" },
  average: { emoji: "🌱", gradient: "from-orange-500 to-amber-500" },
  low: { emoji: "⚡", gradient: "from-rose-500 to-pink-500" },
};

const CHEER_STYLES: Record<
  "streak" | QuizCheerTier,
  { emojis: string[]; gradient: string }
> = {
  streak: {
    emojis: ["🔥", "⚡", "🌟", "🚀", "💎", "👑"],
    gradient: "from-amber-500 to-orange-600",
  },
  hot: {
    emojis: ["🎉", "⭐", "🤩", "👏"],
    gradient: "from-emerald-500 to-teal-500",
  },
  good: {
    emojis: ["💪", "😎", "✨", "🙌"],
    gradient: "from-sky-500 to-blue-500",
  },
  mid: {
    emojis: ["🎯", "🌱", "🧭"],
    gradient: "from-orange-500 to-amber-500",
  },
  low: {
    emojis: ["🧗", "🌤️", "🚴"],
    gradient: "from-rose-500 to-pink-500",
  },
};

// faqat event handler'da chaqiriladi; komponentdan tashqarida turibdi, chunki
// react-compiler lint'i render ichidagi to'g'ridan-to'g'ri Math.random'ni taqiqlaydi
function randomSeed(): number {
  return Math.random();
}

function CheerPopup({ cheer, seed }: { cheer: QuizCheer; seed: number }) {
  const { t } = useTranslation();
  // seed — javob tanlanganda olingan tasodifiy son; shu turkumdagi
  // iboralardan bittasini tanlaydi
  const size =
    cheer.kind === "streak"
      ? STREAK_CHEER_VARIANTS
      : CHEER_TIER_VARIANTS[cheer.tier];
  const variant = Math.min(Math.floor(seed * size), size - 1);
  const style = CHEER_STYLES[cheer.kind === "streak" ? "streak" : cheer.tier];
  const message =
    cheer.kind === "streak"
      ? t(`test.cheer.streak_${variant}`, { count: cheer.streak })
      : t(`test.cheer.${cheer.tier}_${variant}`);
  const emoji = style.emojis[variant % style.emojis.length];
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center"
      aria-live="polite"
    >
      <div
        className={`animate-cheer flex items-center gap-2.5 rounded-2xl bg-linear-to-r ${style.gradient} px-6 py-3 text-white shadow-2xl`}
      >
        <span className="animate-cheer-emoji text-2xl" aria-hidden="true">
          {emoji}
        </span>
        <span className="font-display text-lg font-bold">{message}</span>
      </div>
    </div>
  );
}

interface QuizGameProps {
  unitId?: number;
  fromUnitId?: number;
  toUnitId?: number;
  selectableCount?: boolean;
  onExit: () => void;
}

interface Answer {
  question: QuizQuestion;
  selected: string;
}

export function QuizGame({
  unitId,
  fromUnitId,
  toUnitId,
  selectableCount,
  onExit,
}: QuizGameProps) {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [cheerSeed, setCheerSeed] = useState(0);
  const [direction, setDirection] = useState<QuizDirection>("uz-en");
  const [countInput, setCountInput] = useState(String(MIN_COUNT));
  const [count, setCount] = useState<number | null>(
    selectableCount ? null : MIN_COUNT,
  );

  // max = saytdagi jami so'zlar soni; picker'lar keshidagi books query'dan olinadi
  const booksQuery = useQuery({
    queryKey: ["books"],
    queryFn: getBooks,
    enabled: !!selectableCount && count === null,
  });
  const maxCount = booksQuery.data?.reduce((acc, b) => acc + b.wordCount, 0);

  const quizQuery = useQuery({
    queryKey: [
      "quiz",
      unitId ?? "all",
      fromUnitId ?? 0,
      toUnitId ?? 0,
      direction,
      count,
      round,
    ],
    queryFn: () =>
      getQuiz({
        unitId,
        fromUnitId,
        toUnitId,
        count: count ?? MIN_COUNT,
        direction,
      }),
    enabled: count !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (selected === null) return;
    const timer = setTimeout(() => {
      setSelected(null);
      setIndex((i) => i + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selected]);

  const toggleDirection = () => {
    setDirection((d) => (d === "uz-en" ? "en-uz" : "uz-en"));
    setIndex(0);
    setSelected(null);
    setAnswers([]);
  };

  if (count === null) {
    const parsedCount = Number(countInput);
    const countValid = isValidQuizCount(countInput, maxCount);
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <div className={`flex flex-col gap-4 ${card} animate-fade-in p-6`}>
          <label htmlFor="quiz-count" className="text-sm font-semibold">
            {t("test.question_count")}
          </label>
          <input
            id="quiz-count"
            type="number"
            min={MIN_COUNT}
            max={maxCount}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            className={input}
          />
          <p className="text-xs text-muted-foreground">
            {maxCount !== undefined &&
              t("test.question_count_hint", { min: MIN_COUNT, max: maxCount })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!countValid}
            onClick={() => setCount(parsedCount)}
            className={btn.primary}
          >
            {t("test.start")}
          </button>
          <button type="button" onClick={onExit} className={btn.ghost}>
            {t("test.back")}
          </button>
        </div>
      </div>
    );
  }

  if (quizQuery.isLoading) {
    return <Loader />;
  }

  if (quizQuery.isError || !quizQuery.data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="w-full">
          <StateCard variant="error">
            {t("common.error")}: {quizQuery.error?.message}
          </StateCard>
        </div>
        <button type="button" onClick={onExit} className={btn.ghost}>
          {t("test.back")}
        </button>
      </div>
    );
  }

  const questions = quizQuery.data.questions;

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setRound((r) => r + 1);
  };

  if (index >= questions.length) {
    const { wrong, correctCount, percent } = scoreQuiz(answers);
    const tier = getQuizFeedbackTier(percent);
    const feedback = FEEDBACK_STYLES[tier];
    return (
      <div className="flex animate-pop flex-col gap-5">
        <div className="flex items-center gap-3">
          {wrong.length === 0 ? (
            <PartyPopper className="h-8 w-8 text-warning" aria-hidden="true" />
          ) : (
            <Trophy className="h-8 w-8 text-warning" aria-hidden="true" />
          )}
          <h2 className="text-xl font-bold">{t("test.results")}</h2>
          <span className="ml-auto bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text font-display text-4xl font-bold text-transparent">
            {percent}%
          </span>
        </div>
        <div
          className={`animate-pop rounded-2xl bg-linear-to-r ${feedback.gradient} p-5 text-white shadow-lg`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">
              {feedback.emoji}
            </span>
            <div>
              <p className="font-display text-lg font-bold">
                {t(`test.feedback.${tier}.title`)}
              </p>
              <p className="mt-1 text-sm text-white/90">
                {t(`test.feedback.${tier}.message`)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="rounded-xl bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-600 dark:text-green-400">
            {t("test.correct_count", { count: correctCount })}
          </span>
          <span className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400">
            {t("test.wrong_count", { count: wrong.length })}
          </span>
        </div>
        {wrong.length > 0 ? (
          <div className={card}>
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">
              {t("test.wrong_list_title")}
            </h3>
            <ul className="divide-y divide-border/60">
              {wrong.map((a) => (
                <li
                  key={a.question.id}
                  className="flex flex-col gap-1 px-4 py-3"
                >
                  <span className="text-xl font-semibold">
                    {a.question.question}
                  </span>
                  <span className="text-lg text-red-600 dark:text-red-400">
                    {t("test.your_answer")}: {a.selected}
                  </span>
                  <span className="text-lg text-green-600 dark:text-green-400">
                    {t("test.correct_answer")}: {a.question.correct}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
            {t("test.no_wrong")}
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={restart} className={btn.primary}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("test.restart")}
          </button>
          <button type="button" onClick={onExit} className={btn.ghost}>
            {t("test.back")}
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const answered = selected !== null;
  const cheer = answered ? getQuizCheer(answers) : null;

  const onSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setCheerSeed(randomSeed());
    setAnswers((prev) => [...prev, { question, selected: option }]);
  };

  const onNext = () => {
    setSelected(null);
    setIndex((i) => i + 1);
  };

  const optionClass = (option: string): string => {
    const base =
      "w-full rounded-xl border-2 px-3 py-2 text-left text-lg font-semibold transition-all sm:px-4 sm:py-3.5 ";
    if (!answered) {
      return (
        base +
        "border-border bg-card hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]"
      );
    }
    if (option === question.correct) {
      return (
        base +
        "animate-pop border-green-500 bg-green-500 text-white shadow-md shadow-green-500/30"
      );
    }
    if (option === selected) {
      return (
        base +
        "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30"
      );
    }
    return base + "border-border bg-card text-muted-foreground opacity-60";
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      {cheer && (
        <CheerPopup key={`cheer-${index}`} cheer={cheer} seed={cheerSeed} />
      )}
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-sm text-muted-foreground">
          {t("test.question_progress", {
            current: index + 1,
            total: questions.length,
          })}
        </div>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={toggleDirection}
          className={`${btn.ghost} uppercase`}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          {direction === "uz-en" ? "UZ - EN" : "EN - UZ"}
        </button>
      </div>
      <div
        key={question.id}
        className={`${card} animate-fade-in p-2 text-center sm:p-8`}
      >
        <span className="font-display text-[34px] font-bold">
          {question.question}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={answered}
            onClick={() => onSelect(option)}
            className={optionClass(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <button
          type="button"
          onClick={onNext}
          className={`${btn.primary} self-end`}
        >
          {index + 1 >= questions.length ? t("test.finish") : t("test.next")}
        </button>
      )}
    </div>
  );
}
