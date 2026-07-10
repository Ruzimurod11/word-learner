export const MIN_COUNT = 20;

// hard darajada javob qo'lda yoziladi: registr va ortiqcha bo'shliqlar hisobga
// olinmaydi. easy darajada variantlar bazadagi matnning o'zi, shuning uchun
// normalizatsiya natijani o'zgartirmaydi
export function isAnswerCorrect(selected: string, correct: string): boolean {
  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  return normalize(selected) === normalize(correct);
}

export function isValidQuizCount(raw: string, max: number | undefined): boolean {
  const parsed = Number(raw);
  return (
    max !== undefined &&
    Number.isInteger(parsed) &&
    parsed >= MIN_COUNT &&
    parsed <= max
  );
}

export type QuizFeedbackTier =
  | "perfect"
  | "excellent"
  | "great"
  | "good"
  | "average"
  | "low";

export function getQuizFeedbackTier(percent: number): QuizFeedbackTier {
  if (percent >= 100) return "perfect";
  if (percent >= 95) return "excellent";
  if (percent >= 85) return "great";
  if (percent >= 70) return "good";
  if (percent >= 50) return "average";
  return "low";
}

export const STREAK_CHEER_VARIANTS = 16;
export const STREAK_CHEER_MIN = 3;

// 100 ta rag'bat iborasi joriy natija foiziga qarab 4 darajaga bo'lingan
export const CHEER_TIER_VARIANTS = {
  hot: 25,
  good: 25,
  mid: 25,
  low: 25,
} as const;

export type QuizCheerTier = keyof typeof CHEER_TIER_VARIANTS;

export function getQuizCheerTier(percent: number): QuizCheerTier {
  if (percent >= 90) return "hot";
  if (percent >= 70) return "good";
  if (percent >= 50) return "mid";
  return "low";
}

export type QuizCheer =
  | { kind: "streak"; streak: number }
  | { kind: "tier"; tier: QuizCheerTier; percent: number };

export function getTrailingStreak<
  A extends { selected: string; question: { correct: string } },
>(answers: A[]): number {
  let streak = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!isAnswerCorrect(answers[i].selected, answers[i].question.correct)) break;
    streak++;
  }
  return streak;
}

// Har bir javobdan keyingi rag'bat popup'i: streak bo'lsa streak xabari,
// aks holda joriy foizga mos darajadagi ibora; matn varianti komponentda
// tasodifiy tanlanadi
export function getQuizCheer<
  A extends { selected: string; question: { correct: string } },
>(answers: A[]): QuizCheer | null {
  if (answers.length === 0) return null;
  const streak = getTrailingStreak(answers);
  if (streak >= STREAK_CHEER_MIN) {
    return { kind: "streak", streak };
  }
  const { percent } = scoreQuiz(answers);
  return { kind: "tier", tier: getQuizCheerTier(percent), percent };
}

export function scoreQuiz<A extends { selected: string; question: { correct: string } }>(
  answers: A[],
): { wrong: A[]; correctCount: number; percent: number } {
  const wrong = answers.filter(
    (a) => !isAnswerCorrect(a.selected, a.question.correct),
  );
  const correctCount = answers.length - wrong.length;
  const percent =
    answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  return { wrong, correctCount, percent };
}
