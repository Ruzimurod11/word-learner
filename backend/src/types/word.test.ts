import { describe, expect, it } from "vitest";
import {
  createWordSchema,
  quizQuerySchema,
  searchQuerySchema,
  unitWordsQuerySchema,
  updateWordSchema,
} from "./word.ts";

describe("createWordSchema", () => {
  it("trims both fields", () => {
    const result = createWordSchema.parse({ english: "  cat ", translation: " mushuk " });
    expect(result).toEqual({ english: "cat", translation: "mushuk" });
  });

  it("rejects empty or whitespace-only values", () => {
    expect(createWordSchema.safeParse({ english: "", translation: "x" }).success).toBe(false);
    expect(createWordSchema.safeParse({ english: "x", translation: "   " }).success).toBe(false);
  });

  it("accepts an optional trimmed transcription", () => {
    const result = createWordSchema.parse({
      english: "cat",
      translation: "mushuk",
      transcription: " [kæt] ",
    });
    expect(result).toEqual({ english: "cat", translation: "mushuk", transcription: "[kæt]" });
  });

  it("rejects english longer than 100 chars", () => {
    const result = createWordSchema.safeParse({
      english: "a".repeat(101),
      translation: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateWordSchema", () => {
  it("rejects an empty object (at least one field required)", () => {
    expect(updateWordSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(updateWordSchema.safeParse({ english: "cat" }).success).toBe(true);
    expect(updateWordSchema.safeParse({ translation: "mushuk" }).success).toBe(true);
    expect(updateWordSchema.safeParse({ transcription: "[kæt]" }).success).toBe(true);
  });
});

describe("unitWordsQuerySchema", () => {
  it("coerces string query params to numbers", () => {
    expect(unitWordsQuerySchema.parse({ page: "2", pageSize: "50" })).toEqual({
      page: 2,
      pageSize: 50,
    });
  });

  it("applies defaults", () => {
    expect(unitWordsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("rejects out-of-range values", () => {
    expect(unitWordsQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(unitWordsQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("requires a non-blank q", () => {
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "  " }).success).toBe(false);
  });

  it("trims q and applies pagination defaults", () => {
    expect(searchQuerySchema.parse({ q: " cat " })).toEqual({
      q: "cat",
      page: 1,
      pageSize: 20,
    });
  });
});

describe("quizQuerySchema", () => {
  it("applies defaults", () => {
    expect(quizQuerySchema.parse({})).toEqual({ count: 20, direction: "uz-en" });
  });

  it("coerces unit ids", () => {
    const result = quizQuerySchema.parse({ unitId: "3", fromUnitId: "1", toUnitId: "9" });
    expect(result).toMatchObject({ unitId: 3, fromUnitId: 1, toUnitId: 9 });
  });

  it("rejects an unknown direction and non-positive count", () => {
    expect(quizQuerySchema.safeParse({ direction: "xx" }).success).toBe(false);
    expect(quizQuerySchema.safeParse({ count: "0" }).success).toBe(false);
  });
});
