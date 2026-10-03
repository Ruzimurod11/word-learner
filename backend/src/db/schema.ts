import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // "essential" — Essential Words; "vocabulary" — Vocabularies;
    // "passages" — Intermediate passages; "topic" — admin saytdan qo'shgan mavzu
    kind: text("kind").notNull().default("essential"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("books_order_unique_idx").on(table.order)],
);

export const units = pgTable(
  "units",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    // true — admin unitni shu so'z sonida yopgan; yangi so'z qo'shilmaydi
    closed: boolean("closed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("units_book_order_unique_idx").on(table.bookId, table.order),
  ],
);

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  english: text("english").notNull(),
  translation: text("translation").notNull(),
  transcription: text("transcription"),
  // so'z turkumi qisqartmasi: v, n, adj, adv, ...
  partOfSpeech: text("part_of_speech"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const booksRelations = relations(books, ({ many }) => ({
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  book: one(books, { fields: [units.bookId], references: [books.id] }),
  words: many(words),
}));

export const wordsRelations = relations(words, ({ one }) => ({
  unit: one(units, { fields: [words.unitId], references: [units.id] }),
}));

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;

// Admin profili — bitta yozuv (singleton, id = 1).
export const adminProfile = pgTable("admin_profile", {
  id: integer("id").primaryKey().default(1),
  displayName: text("display_name"),
  // data URL ko'rinishida saqlanadi: "data:image/webp;base64,..."
  avatar: text("avatar"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminProfile = typeof adminProfile.$inferSelect;
export type NewAdminProfile = typeof adminProfile.$inferInsert;
