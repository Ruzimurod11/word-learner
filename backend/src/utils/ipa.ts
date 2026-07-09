// IPA yozuvini britaniyacha (OALD/Cambridge, Gimson RP) konvensiyasiga keltiradi.
// Asosiy muammo: ba'zi manbalar (espeak) urg'uni bo'g'in boshiga emas, bevosita
// unli oldiga qo'yadi — `lˈet` o'rniga `ˈlet` bo'lishi kerak.

const VOWELS = "iɪeæaʌɒɔəʊuɜɑɛ";
const CONSONANTS = "bdfɡhjklmnprstvwzðŋʃʒθ";

// Ingliz tilida bo'g'in boshida kelishi mumkin bo'lgan undosh klasterlari.
// Bitta undoshlar (ŋ dan boshqa) alohida tekshiriladi.
const ONSET_CLUSTERS = new Set([
  "str", "spr", "spl", "skr", "skw", "spj", "stj", "skj",
  "pr", "br", "tr", "dr", "kr", "ɡr", "fr", "θr", "ʃr",
  "pl", "bl", "kl", "ɡl", "fl", "sl",
  "sp", "st", "sk", "sm", "sn", "sf", "sw",
  "tw", "dw", "kw", "ɡw", "θw",
  "pj", "bj", "tj", "dj", "kj", "ɡj", "fj", "vj", "mj", "nj", "lj", "hj", "sj",
]);

// tʃ va dʒ — bitta undosh sifatida qaraladi.
function tokenize(cluster: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < cluster.length; i++) {
    const pair = cluster.slice(i, i + 2);
    if (pair === "tʃ" || pair === "dʒ") {
      tokens.push(pair);
      i++;
    } else {
      tokens.push(cluster[i]);
    }
  }
  return tokens;
}

// Klasterning bo'g'in boshi bo'la oladigan eng uzun oxirgi qismini qaytaradi.
function maximalOnset(cluster: string): string {
  const tokens = tokenize(cluster);
  for (let take = Math.min(3, tokens.length); take >= 1; take--) {
    const candidate = tokens.slice(tokens.length - take).join("");
    if (take === 1) {
      if (candidate !== "ŋ") return candidate;
    } else if (ONSET_CLUSTERS.has(candidate)) {
      return candidate;
    }
  }
  return "";
}

// Undosh klasteri + urg'u + unli -> urg'u klasterning onset qismidan oldinga.
// Lookbehind klasterning to'liq (maksimal) olinishini kafolatlaydi, `+` esa
// bo'sh joydan o'tmaydi — shuning uchun ibora so'zlari mustaqil qayta ishlanadi.
const MISPLACED_STRESS = new RegExp(
  `(?<![${CONSONANTS}])([${CONSONANTS}]+)([ˈˌ])(?=[${VOWELS}])`,
  "g",
);

const DIPHTHONGS = ["eɪ", "aɪ", "ɔɪ", "əʊ", "aʊ", "ɪə", "eə", "ʊə"];

// Bo'g'in yadrolarini sanaydi. Yadro — unli (yoki diftong), yoki sillabik
// undosh: `l`/`n` boshqa undoshdan keyin kelsa (`ˈmɪdl`, `ˈsɜːtn` — ikki bo'g'in).
function countSyllables(ipa: string): number {
  const s = ipa.replace(/[ˈˌ]/g, "");
  let count = 0;
  for (let i = 0; i < s.length; ) {
    if (DIPHTHONGS.includes(s.slice(i, i + 2))) {
      count++;
      i += 2;
    } else if (VOWELS.includes(s[i])) {
      count++;
      i++;
    } else if (
      (s[i] === "l" || s[i] === "n") &&
      i > 0 &&
      CONSONANTS.includes(s[i - 1]) &&
      (i === s.length - 1 || CONSONANTS.includes(s[i + 1]))
    ) {
      count++;
      i++;
    } else {
      i++;
    }
  }
  return count;
}

export function normalizeBritishIpa(ipa: string): string {
  let result = ipa.replace(/ʉ/g, "u");

  result = result.replace(MISPLACED_STRESS, (match, cluster: string, mark: string) => {
    const onset = maximalOnset(cluster);
    if (!onset) return match;
    return cluster.slice(0, cluster.length - onset.length) + mark + onset;
  });

  // Bir bo'g'inli so'zda urg'u belgisi yozilmaydi. Iboralarda saqlanadi —
  // u yerda belgi ibora urg'usini ko'rsatadi (`ˈhʌri ˈʌp`).
  if (!/\s/.test(result) && countSyllables(result) === 1) {
    result = result.replace(/[ˈˌ]/g, "");
  }

  return result;
}
