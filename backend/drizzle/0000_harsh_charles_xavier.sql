CREATE TABLE "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"english" text NOT NULL,
	"translation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "words_english_unique_idx" ON "words" USING btree ("english");