DROP INDEX "words_english_lower_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "words_english_translation_lower_unique_idx" ON "words" USING btree (lower("english"),lower("translation"));