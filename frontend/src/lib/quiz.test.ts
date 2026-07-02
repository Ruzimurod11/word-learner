import { describe, expect, it } from "vitest";
import { MIN_COUNT, isValidQuizCount, scoreQuiz } from "@/lib/quiz";

const answer = (correct: string, selected: string) => ({
  question: { correct },
  selected,
});

describe("scoreQuiz", () => {
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
