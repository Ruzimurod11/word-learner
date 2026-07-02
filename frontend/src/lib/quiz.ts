export const MIN_COUNT = 20;

export function isValidQuizCount(raw: string, max: number | undefined): boolean {
  const parsed = Number(raw);
  return (
    max !== undefined &&
    Number.isInteger(parsed) &&
    parsed >= MIN_COUNT &&
    parsed <= max
  );
}

export function scoreQuiz<A extends { selected: string; question: { correct: string } }>(
  answers: A[],
): { wrong: A[]; correctCount: number; percent: number } {
  const wrong = answers.filter((a) => a.selected !== a.question.correct);
  const correctCount = answers.length - wrong.length;
  const percent =
    answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  return { wrong, correctCount, percent };
}
