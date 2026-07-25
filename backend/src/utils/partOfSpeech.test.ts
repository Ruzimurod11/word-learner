import { describe, expect, it } from "vitest";
import { mapApiPartOfSpeech, pickPartOfSpeech } from "./partOfSpeech.ts";

describe("mapApiPartOfSpeech", () => {
  it("maps standard API values to abbreviations", () => {
    expect(mapApiPartOfSpeech("noun")).toBe("n");
    expect(mapApiPartOfSpeech("verb")).toBe("v");
    expect(mapApiPartOfSpeech("adjective")).toBe("adj");
    expect(mapApiPartOfSpeech("adverb")).toBe("adv");
    expect(mapApiPartOfSpeech("article")).toBe("article");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(mapApiPartOfSpeech("  Noun ")).toBe("n");
  });

  it("maps exclamation to interj", () => {
    expect(mapApiPartOfSpeech("exclamation")).toBe("interj");
  });

  it("returns null for unknown values", () => {
    expect(mapApiPartOfSpeech("abbreviation")).toBeNull();
    expect(mapApiPartOfSpeech("")).toBeNull();
  });
});

// n ta bo'sh ta'rif — faqat soni muhim
const defs = (n: number): unknown[] => Array.from({ length: n }, () => ({}));

describe("pickPartOfSpeech", () => {
  it("picks the part of speech with the most definitions, not the first one", () => {
    // "cruel" kabi: API verb'ni birinchi qaytaradi, lekin asosiysi adjective
    const entries = [
      {
        meanings: [
          { partOfSpeech: "verb", definitions: defs(2) },
          { partOfSpeech: "adjective", definitions: defs(3) },
        ],
      },
      { meanings: [{ partOfSpeech: "noun", definitions: defs(1) }] },
    ];
    expect(pickPartOfSpeech(entries)).toBe("adj");
  });

  it("sums definitions of the same part of speech across entries", () => {
    const entries = [
      { meanings: [{ partOfSpeech: "noun", definitions: defs(2) }] },
      { meanings: [{ partOfSpeech: "verb", definitions: defs(3) }] },
      { meanings: [{ partOfSpeech: "noun", definitions: defs(2) }] },
    ];
    expect(pickPartOfSpeech(entries)).toBe("n");
  });

  it("keeps the first one on a tie", () => {
    const entries = [
      {
        meanings: [
          { partOfSpeech: "verb", definitions: defs(2) },
          { partOfSpeech: "noun", definitions: defs(2) },
        ],
      },
    ];
    expect(pickPartOfSpeech(entries)).toBe("v");
  });

  it("ignores unmappable parts of speech and returns null when nothing maps", () => {
    expect(
      pickPartOfSpeech([
        { meanings: [{ partOfSpeech: "abbreviation", definitions: defs(5) }] },
      ]),
    ).toBeNull();
    expect(pickPartOfSpeech([])).toBeNull();
    expect(pickPartOfSpeech([{}])).toBeNull();
  });
});
