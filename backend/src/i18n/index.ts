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
    "errors.reorder_words_failed": "So'zlar tartibini o'zgartirishda xatolik",
    "errors.reorder_mismatch": "So'zlar ro'yxati mos kelmadi",
    "errors.search_failed": "Qidiruvda xatolik",
    "errors.quiz_not_enough_words": "Test tuzish uchun so'zlar yetarli emas",
    "errors.quiz_failed": "Testni yuklashda xatolik",
    "errors.invalid_range": "Noto'g'ri oraliq: boshlanish tugashdan keyin bo'lmasligi kerak",
    "errors.internal": "Server xatosi",
    "errors.unauthorized": "Avtorizatsiya talab qilinadi",
    "errors.invalid_password": "Parol noto'g'ri",
    "errors.auth_not_configured": "Admin paroli sozlanmagan",
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
    "errors.reorder_words_failed": "Failed to reorder words",
    "errors.reorder_mismatch": "Word list did not match",
    "errors.search_failed": "Search failed",
    "errors.quiz_not_enough_words": "Not enough words to build a quiz",
    "errors.quiz_failed": "Failed to load quiz",
    "errors.invalid_range": "Invalid range: start must not be after end",
    "errors.internal": "Internal server error",
    "errors.unauthorized": "Authorization required",
    "errors.invalid_password": "Incorrect password",
    "errors.auth_not_configured": "Admin password is not configured",
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
    "errors.reorder_words_failed": "Не удалось изменить порядок слов",
    "errors.reorder_mismatch": "Список слов не совпал",
    "errors.search_failed": "Ошибка поиска",
    "errors.quiz_not_enough_words": "Недостаточно слов для теста",
    "errors.quiz_failed": "Не удалось загрузить тест",
    "errors.invalid_range": "Неверный диапазон: начало не может быть после конца",
    "errors.internal": "Внутренняя ошибка сервера",
    "errors.unauthorized": "Требуется авторизация",
    "errors.invalid_password": "Неверный пароль",
    "errors.auth_not_configured": "Пароль администратора не настроен",
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
