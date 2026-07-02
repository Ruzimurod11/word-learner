import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { getBooks } from "@/api/book-api";
import { getQuiz } from "@/api/word-api";
import type { QuizDirection, QuizQuestion } from "@/types/word";
import { StateCard, btn, card, input } from "@/components/ui";

interface QuizGameProps {
  unitId?: number;
  fromUnitId?: number;
  toUnitId?: number;
  selectableCount?: boolean;
  onExit: () => void;
}

const MIN_COUNT = 20;

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
      getQuiz({ unitId, fromUnitId, toUnitId, count: count ?? MIN_COUNT, direction }),
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
    const countValid =
      maxCount !== undefined &&
      Number.isInteger(parsedCount) &&
      parsedCount >= MIN_COUNT &&
      parsedCount <= maxCount;
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
    return <StateCard>{t("common.loading")}</StateCard>;
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
    const wrong = answers.filter((a) => a.selected !== a.question.correct);
    const correctCount = answers.length - wrong.length;
    const percent =
      answers.length > 0
        ? Math.round((correctCount / answers.length) * 100)
        : 0;
    return (
      <div className="flex animate-pop flex-col gap-5">
        <div className="flex items-center gap-3">
          {wrong.length === 0 ? (
            <PartyPopper className="h-8 w-8 text-warning" aria-hidden="true" />
          ) : (
            <Trophy className="h-8 w-8 text-warning" aria-hidden="true" />
          )}
          <h2 className="text-xl font-bold">{t("test.results")}</h2>
          <span className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text font-display text-4xl font-bold text-transparent">
            {percent}%
          </span>
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
                <li key={a.question.id} className="flex flex-col gap-1 px-4 py-3">
                  <span className="text-xl font-semibold">{a.question.question}</span>
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

  const onSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswers((prev) => [...prev, { question, selected: option }]);
  };

  const onNext = () => {
    setSelected(null);
    setIndex((i) => i + 1);
  };

  const optionClass = (option: string): string => {
    const base =
      "w-full rounded-xl border-2 px-4 py-3.5 text-left text-lg font-semibold transition-all ";
    if (!answered) {
      return (
        base +
        "border-border bg-card hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]"
      );
    }
    if (option === question.correct) {
      return (
        base + "animate-pop border-green-500 bg-green-500 text-white shadow-md shadow-green-500/30"
      );
    }
    if (option === selected) {
      return (
        base + "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30"
      );
    }
    return base + "border-border bg-card text-muted-foreground opacity-60";
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-sm text-muted-foreground">
          {t("test.question_progress", {
            current: index + 1,
            total: questions.length,
          })}
        </div>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
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
      <div key={question.id} className={`${card} animate-fade-in p-8 text-center`}>
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
