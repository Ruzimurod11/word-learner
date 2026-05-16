import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const words = pgTable(
  "words",
  {
    id: serial("id").primaryKey(),
    english: text("english").notNull(),
    translation: text("translation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("words_english_unique_idx").on(table.english)],
);

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
