import { describe, expect, it } from "vitest";
import { bookGradient } from "@/components/ui";

describe("bookGradient", () => {
  it("returns a distinct gradient for indices 0-5", () => {
    const gradients = [0, 1, 2, 3, 4, 5].map(bookGradient);
    expect(new Set(gradients).size).toBe(6);
    for (const g of gradients) expect(g).toMatch(/^from-.+ to-.+$/);
  });

  it("wraps around after the palette ends", () => {
    expect(bookGradient(6)).toBe(bookGradient(0));
    expect(bookGradient(7)).toBe(bookGradient(1));
  });

  it("handles negative indices via Math.abs", () => {
    expect(bookGradient(-1)).toBe(bookGradient(1));
  });
});
