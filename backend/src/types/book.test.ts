import { describe, expect, it } from "vitest";
import { bookIdSchema, createTopicSchema } from "./book.ts";

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

describe("createTopicSchema", () => {
  it("trims the title and turns a blank description into null", () => {
    expect(createTopicSchema.parse({ title: "  Family  ", description: "  " })).toEqual({
      title: "Family",
      description: null,
    });
  });

  it("keeps a description and defaults a missing one to null", () => {
    expect(createTopicSchema.parse({ title: "Family", description: " Uy " })).toEqual({
      title: "Family",
      description: "Uy",
    });
    expect(createTopicSchema.parse({ title: "Family" })).toEqual({
      title: "Family",
      description: null,
    });
  });

  it("rejects an empty title", () => {
    expect(createTopicSchema.safeParse({ title: "   " }).success).toBe(false);
  });
});
