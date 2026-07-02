import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getBooks } from "@/api/book-api";
import { getQuiz } from "@/api/word-api";
import type { QuizDirection, QuizQuestion } from "@/types/word";

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
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <label
            htmlFor="quiz-count"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {t("test.question_count")}
          </label>
          <input
            id="quiz-count"
            type="number"
            min={MIN_COUNT}
            max={maxCount}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {maxCount !== undefined &&
              t("test.question_count_hint", { min: MIN_COUNT, max: maxCount })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!countValid}
            onClick={() => setCount(parsedCount)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("test.start")}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("test.back")}
          </button>
        </div>
      </div>
    );
  }

  if (quizQuery.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t("common.loading")}
      </div>
    );
  }

  if (quizQuery.isError || !quizQuery.data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {t("common.error")}: {quizQuery.error?.message}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
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
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold">{t("test.results")}</h2>
        <div className="flex gap-3">
          <span className="rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
            {t("test.correct_count", { count: correctCount })}
          </span>
          <span className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
            {t("test.wrong_count", { count: wrong.length })}
          </span>
        </div>
        {wrong.length > 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
              {t("test.wrong_list_title")}
            </h3>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {wrong.map((a) => (
                <li key={a.question.id} className="flex flex-col gap-1 px-4 py-3">
                  <span className="font-semibold">{a.question.question}</span>
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {t("test.your_answer")}: {a.selected}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {t("test.correct_answer")}: {a.question.correct}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {t("test.no_wrong")}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("test.restart")}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
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
      "w-full rounded-md border px-4 py-3 text-left text-sm font-medium transition ";
    if (!answered) {
      return (
        base +
        "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      );
    }
    if (option === question.correct) {
      return base + "border-green-600 bg-green-600 text-white dark:bg-green-500 dark:border-green-500";
    }
    if (option === selected) {
      return base + "border-red-600 bg-red-600 text-white dark:bg-red-500 dark:border-red-500";
    }
    return (
      base +
      "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("test.question_progress", {
            current: index + 1,
            total: questions.length,
          })}
        </div>
        <button
          type="button"
          onClick={toggleDirection}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium uppercase text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {direction === "uz-en" ? "UZ - EN" : "EN - UZ"}
        </button>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-3xl font-bold">{question.question}</span>
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
          className="self-end rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {index + 1 >= questions.length ? t("test.finish") : t("test.next")}
        </button>
      )}
    </div>
  );
}
