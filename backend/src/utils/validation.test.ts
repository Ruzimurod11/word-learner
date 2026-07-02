import { describe, expect, it } from "vitest";
import { createWordSchema, updateWordSchema } from "../types/word.ts";
import { formatZodError, isUniqueViolation } from "./validation.ts";

describe("formatZodError", () => {
  it("joins issues as 'path: message' separated by '; '", () => {
    const result = createWordSchema.safeParse({ english: "", translation: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe(
      "english: English so'z bo'sh bo'lmasligi kerak; translation: Tarjima bo'sh bo'lmasligi kerak",
    );
  });

  it("falls back to 'value' for issues without a path", () => {
    const result = updateWordSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe(
      "value: Kamida bitta maydon yuborilishi kerak",
    );
  });
});

describe("isUniqueViolation", () => {
  it("returns false for non-Error values", () => {
    expect(isUniqueViolation("unique")).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });

  it("detects 'unique' in the error message case-insensitively", () => {
    expect(
      isUniqueViolation(new Error("duplicate key value violates UNIQUE constraint")),
    ).toBe(true);
  });

  it("detects Postgres 23505 via the error cause", () => {
    const err = new Error("query failed", { cause: { code: "23505" } });
    expect(isUniqueViolation(err)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isUniqueViolation(new Error("connection refused"))).toBe(false);
    expect(isUniqueViolation(new Error("fail", { cause: { code: "23503" } }))).toBe(false);
  });
});
