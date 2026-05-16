DROP INDEX "words_unit_english_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "words_english_lower_unique_idx" ON "words" USING btree (lower("english"));