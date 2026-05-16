import type { NextFunction, Request, Response } from "express";

export type Lang = "uz" | "en" | "ru";

export const SUPPORTED_LANGS: Lang[] = ["uz", "en", "ru"];
export const DEFAULT_LANG: Lang = "uz";

type Messages = Record<string, string>;

const messages: Record<Lang, Messages> = {
  uz: {
    "errors.invalid_book_id": "Noto'g'ri kitob ID",
    "errors.invalid_unit_id": "Noto'g'ri unit ID",
    "errors.invalid_id": "Noto'g'ri ID",
    "errors.book_not_found": "Kitob topilmadi",
    "errors.unit_not_found": "Unit topilmadi",
    "errors.word_not_found": "So'z topilmadi",
    "errors.duplicate_word": "Bu so'z lug'atda allaqachon mavjud",
    "errors.duplicate_word_at":
      "Bu so'z lug'atda allaqachon mavjud (Book {{book}} / Unit {{unit}})",
    "errors.list_books_failed": "Kitoblarni olishda xatolik",
    "errors.get_book_failed": "Kitobni olishda xatolik",
    "errors.list_words_failed": "So'zlarni olishda xatolik",
    "errors.create_word_failed": "So'z qo'shishda xatolik",
    "errors.update_word_failed": "So'zni yangilashda xatolik",
    "errors.delete_word_failed": "O'chirishda xatolik",
    "errors.search_failed": "Qidiruvda xatolik",
    "errors.internal": "Server xatosi",
  },
  en: {
    "errors.invalid_book_id": "Invalid book ID",
    "errors.invalid_unit_id": "Invalid unit ID",
    "errors.invalid_id": "Invalid ID",
    "errors.book_not_found": "Book not found",
    "errors.unit_not_found": "Unit not found",
    "errors.word_not_found": "Word not found",
    "errors.duplicate_word": "This word already exists in the dictionary",
    "errors.duplicate_word_at":
      "This word already exists in the dictionary (Book {{book}} / Unit {{unit}})",
    "errors.list_books_failed": "Failed to load books",
    "errors.get_book_failed": "Failed to load book",
    "errors.list_words_failed": "Failed to load words",
    "errors.create_word_failed": "Failed to add word",
    "errors.update_word_failed": "Failed to update word",
    "errors.delete_word_failed": "Failed to delete word",
    "errors.search_failed": "Search failed",
    "errors.internal": "Internal server error",
  },
  ru: {
    "errors.invalid_book_id": "Неверный ID книги",
    "errors.invalid_unit_id": "Неверный ID юнита",
    "errors.invalid_id": "Неверный ID",
    "errors.book_not_found": "Книга не найдена",
    "errors.unit_not_found": "Юнит не найден",
    "errors.word_not_found": "Слово не найдено",
    "errors.duplicate_word": "Это слово уже есть в словаре",
    "errors.duplicate_word_at":
      "Это слово уже есть в словаре (Книга {{book}} / Юнит {{unit}})",
    "errors.list_books_failed": "Не удалось загрузить книги",
    "errors.get_book_failed": "Не удалось загрузить книгу",
    "errors.list_words_failed": "Не удалось загрузить слова",
    "errors.create_word_failed": "Не удалось добавить слово",
    "errors.update_word_failed": "Не удалось обновить слово",
    "errors.delete_word_failed": "Не удалось удалить слово",
    "errors.search_failed": "Ошибка поиска",
    "errors.internal": "Внутренняя ошибка сервера",
  },
};

export function t(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  let msg = messages[lang]?.[key] ?? messages[DEFAULT_LANG][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(`{{${k}}}`, String(v));
    }
  }
  return msg;
}

export function parseAcceptLanguage(header: string | undefined): Lang {
  if (!header) return DEFAULT_LANG;
  const parts = header.split(",").map((p) => p.trim().split(";")[0].toLowerCase());
  for (const part of parts) {
    const base = part.split("-")[0] as Lang;
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  return DEFAULT_LANG;
}

const LANG_KEY = Symbol.for("vocab.lang");

interface LangCarrier {
  [LANG_KEY]?: Lang;
}

export function getLang(req: Request): Lang {
  return (req as Request & LangCarrier)[LANG_KEY] ?? DEFAULT_LANG;
}

export function languageMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as Request & LangCarrier)[LANG_KEY] = parseAcceptLanguage(
    req.headers["accept-language"],
  );
  next();
}
