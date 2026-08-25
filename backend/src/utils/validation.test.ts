import { describe, expect, it } from "vitest";
import { createWordSchema, updateWordSchema } from "../types/word.ts";
import { formatZodError } from "./validation.ts";

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
