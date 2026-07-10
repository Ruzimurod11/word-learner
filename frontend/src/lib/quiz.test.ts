import { describe, expect, it } from "vitest";
import {
  MIN_COUNT,
  STREAK_CHEER_MIN,
  getQuizCheer,
  getQuizCheerTier,
  getQuizFeedbackTier,
  getTrailingStreak,
  isAnswerCorrect,
  isValidQuizCount,
  scoreQuiz,
} from "@/lib/quiz";

const answer = (correct: string, selected: string) => ({
  question: { correct },
  selected,
});

describe("isAnswerCorrect", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(isAnswerCorrect("  Car ", "car")).toBe(true);
    expect(isAnswerCorrect("CAR", "car")).toBe(true);
  });

  it("collapses repeated inner whitespace", () => {
    expect(isAnswerCorrect("ice   cream", "ice cream")).toBe(true);
  });

  it("rejects a different word", () => {
    expect(isAnswerCorrect("automobile", "car")).toBe(false);
    expect(isAnswerCorrect("", "car")).toBe(false);
  });
});

describe("scoreQuiz", () => {
  it("accepts a typed answer that differs only by case or spacing", () => {
    const result = scoreQuiz([answer("car", " CAR "), answer("ice cream", "ice  cream")]);
    expect(result).toEqual({ wrong: [], correctCount: 2, percent: 100 });
  });

  it("returns 100% when all answers are correct", () => {
    const result = scoreQuiz([answer("cat", "cat"), answer("dog", "dog")]);
    expect(result).toEqual({ wrong: [], correctCount: 2, percent: 100 });
  });

  it("collects wrong answers and rounds the percentage", () => {
    const wrongOne = answer("dog", "cat");
    const result = scoreQuiz([answer("cat", "cat"), answer("sun", "sun"), wrongOne]);
    expect(result.wrong).toEqual([wrongOne]);
    expect(result.correctCount).toBe(2);
    expect(result.percent).toBe(67);
  });

  it("returns 0% for an empty answer list (no NaN)", () => {
    expect(scoreQuiz([])).toEqual({ wrong: [], correctCount: 0, percent: 0 });
  });
});

describe("isValidQuizCount", () => {
  it("accepts integers within [MIN_COUNT, max]", () => {
    expect(isValidQuizCount(String(MIN_COUNT), 100)).toBe(true);
    expect(isValidQuizCount("100", 100)).toBe(true);
  });

  it("rejects values below the minimum or above the maximum", () => {
    expect(isValidQuizCount("19", 100)).toBe(false);
    expect(isValidQuizCount("1000", 100)).toBe(false);
  });

  it("rejects non-integers and non-numbers", () => {
    expect(isValidQuizCount("20.5", 100)).toBe(false);
    expect(isValidQuizCount("abc", 100)).toBe(false);
  });

  it("rejects everything while max is unknown", () => {
    expect(isValidQuizCount("20", undefined)).toBe(false);
  });
});

describe("getTrailingStreak", () => {
  it("counts consecutive correct answers from the end", () => {
    expect(getTrailingStreak([])).toBe(0);
    expect(getTrailingStreak([answer("cat", "cat")])).toBe(1);
    expect(
      getTrailingStreak([
        answer("dog", "sun"),
        answer("cat", "cat"),
        answer("sun", "sun"),
      ]),
    ).toBe(2);
  });

  it("resets to 0 when the last answer is wrong", () => {
    expect(
      getTrailingStreak([answer("cat", "cat"), answer("dog", "sun")]),
    ).toBe(0);
  });
});

describe("getQuizCheerTier", () => {
  it("maps running percentages to tiers at the boundaries", () => {
    expect(getQuizCheerTier(100)).toBe("hot");
    expect(getQuizCheerTier(90)).toBe("hot");
    expect(getQuizCheerTier(89)).toBe("good");
    expect(getQuizCheerTier(70)).toBe("good");
    expect(getQuizCheerTier(69)).toBe("mid");
    expect(getQuizCheerTier(50)).toBe("mid");
    expect(getQuizCheerTier(49)).toBe("low");
    expect(getQuizCheerTier(0)).toBe("low");
  });
});

describe("getQuizCheer", () => {
  const correct = () => answer("cat", "cat");
  const wrong = () => answer("dog", "sun");

  it("returns null before any answer", () => {
    expect(getQuizCheer([])).toBeNull();
  });

  it("returns a tier cheer based on the running percent", () => {
    expect(getQuizCheer([correct()])).toEqual({
      kind: "tier",
      tier: "hot",
      percent: 100,
    });
    expect(getQuizCheer([correct(), wrong()])).toEqual({
      kind: "tier",
      tier: "mid",
      percent: 50,
    });
    expect(getQuizCheer([wrong(), wrong(), correct()])).toEqual({
      kind: "tier",
      tier: "low",
      percent: 33,
    });
  });

  it("returns a streak cheer with the current count once the threshold is reached", () => {
    expect(
      getQuizCheer(Array.from({ length: STREAK_CHEER_MIN - 1 }, correct)),
    ).toMatchObject({ kind: "tier" });
    for (const streak of [STREAK_CHEER_MIN, 10, 25]) {
      const answers = Array.from({ length: streak }, correct);
      expect(getQuizCheer(answers)).toEqual({ kind: "streak", streak });
    }
  });
});

describe("getQuizFeedbackTier", () => {
  it("maps percentages to tiers at the boundaries", () => {
    expect(getQuizFeedbackTier(100)).toBe("perfect");
    expect(getQuizFeedbackTier(99)).toBe("excellent");
    expect(getQuizFeedbackTier(95)).toBe("excellent");
    expect(getQuizFeedbackTier(94)).toBe("great");
    expect(getQuizFeedbackTier(85)).toBe("great");
    expect(getQuizFeedbackTier(84)).toBe("good");
    expect(getQuizFeedbackTier(70)).toBe("good");
    expect(getQuizFeedbackTier(69)).toBe("average");
    expect(getQuizFeedbackTier(50)).toBe("average");
    expect(getQuizFeedbackTier(49)).toBe("low");
    expect(getQuizFeedbackTier(0)).toBe("low");
  });
});
