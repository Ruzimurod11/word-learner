import { describe, expect, it } from "vitest";
import { bookIdSchema } from "./book.ts";

describe("bookIdSchema", () => {
  it("coerces a numeric string to a positive integer", () => {
    expect(bookIdSchema.parse("5")).toBe(5);
  });

  it("rejects zero, negatives, non-numbers and non-integers", () => {
    expect(bookIdSchema.safeParse("0").success).toBe(false);
    expect(bookIdSchema.safeParse(-1).success).toBe(false);
    expect(bookIdSchema.safeParse("abc").success).toBe(false);
    expect(bookIdSchema.safeParse(1.5).success).toBe(false);
  });
});
