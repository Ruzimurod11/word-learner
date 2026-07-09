import { describe, expect, it } from "vitest";
import { normalizeBritishIpa } from "./ipa.ts";

describe("normalizeBritishIpa", () => {
  it("moves the stress mark to the start of the syllable onset", () => {
    expect(normalizeBritishIpa("pˈiːtsəz")).toBe("ˈpiːtsəz");
    expect(normalizeBritishIpa("fərˈevə")).toBe("fəˈrevə");
    expect(normalizeBritishIpa("ʌnfˈɔːtʃənətli")).toBe("ʌnˈfɔːtʃənətli");
    expect(normalizeBritishIpa("iːkənˈɒmɪks")).toBe("iːkəˈnɒmɪks");
  });

  it("takes the maximal legal onset, not the whole consonant run", () => {
    expect(normalizeBritishIpa("strˈeɪtən")).toBe("ˈstreɪtən");
    expect(normalizeBritishIpa("endʒˈɔɪɪŋ")).toBe("enˈdʒɔɪɪŋ"); // dʒ is an onset, ndʒ is not
    expect(normalizeBritishIpa("ʌnlˈʌki")).toBe("ʌnˈlʌki");
    expect(normalizeBritishIpa("lˈɒŋslˈiːvd")).toBe("ˈlɒŋˈsliːvd"); // sl, not ŋsl
    expect(normalizeBritishIpa("tʃˈek")).toBe("tʃek"); // tʃ is one consonant
  });

  it("never moves a stress mark across a space", () => {
    expect(normalizeBritishIpa("lˈet juː nˈəʊ")).toBe("ˈlet juː ˈnəʊ");
    expect(normalizeBritishIpa("pˈɔɪnt ɒv vjˈuː")).toBe("ˈpɔɪnt ɒv ˈvjuː");
    expect(normalizeBritishIpa("kʊdənt stˈænd")).toBe("kʊdənt ˈstænd");
  });

  it("drops the stress mark from single-syllable words", () => {
    expect(normalizeBritishIpa("tˈaɪt")).toBe("taɪt");
    expect(normalizeBritishIpa("skˈeɪt")).toBe("skeɪt");
    expect(normalizeBritishIpa("smˈɑːt")).toBe("smɑːt");
    expect(normalizeBritishIpa("wˌɪtʃ")).toBe("wɪtʃ");
  });

  it("keeps the stress mark when a syllabic l/n forms a second syllable", () => {
    for (const ipa of ["ˈiːvl", "ˈmɪdl", "ˈsɜːtn", "ˈfʌŋkʃn", "ˈpleznt", "ˈnɔːml"]) {
      expect(normalizeBritishIpa(ipa)).toBe(ipa);
    }
  });

  it("keeps the stress mark when a schwa follows a diphthong", () => {
    for (const ipa of ["ˈləʊə", "ˈpəʊɪt", "ˈdʒaɪənt", "ˈtraɪəl", "ˈflaʊə"]) {
      expect(normalizeBritishIpa(ipa)).toBe(ipa);
    }
  });

  it("still strips the mark when the coda consonant is not syllabic", () => {
    expect(normalizeBritishIpa("ˈfʌnd")).toBe("fʌnd"); // n follows a vowel
    expect(normalizeBritishIpa("ˈprɔːnz")).toBe("prɔːnz"); // n follows ː
    expect(normalizeBritishIpa("ˈrəʊ")).toBe("rəʊ");
  });

  it("keeps phrase-level stress marks on single-syllable words", () => {
    expect(normalizeBritishIpa("hˈʌri ˈʌp")).toBe("ˈhʌri ˈʌp");
    expect(normalizeBritishIpa("ɡˈɪv ˈʌp")).toBe("ˈɡɪv ˈʌp");
  });

  it("replaces ʉ with u", () => {
    expect(normalizeBritishIpa("rʉːd")).toBe("ruːd");
  });

  it("leaves already-correct transcriptions untouched", () => {
    for (const ipa of [
      "əˈbʌv",
      "ɪɡˈnɔː",
      "ˌkɒmprɪˈhend",
      "fɔːr ˈeɪdʒɪz",
      "ɡəʊ əˈweɪ",
      "pʊt ˈaʊt",
      "ˈprɒdʒekt",
      "smel",
      "tʃɑːt",
    ]) {
      expect(normalizeBritishIpa(ipa)).toBe(ipa);
    }
  });

  it("is idempotent", () => {
    for (const ipa of ["pˈiːtsəz", "lˈet juː nˈəʊ", "rʉːd", "tˈaɪt", "endʒˈɔɪɪŋ"]) {
      const once = normalizeBritishIpa(ipa);
      expect(normalizeBritishIpa(once)).toBe(once);
    }
  });
});
