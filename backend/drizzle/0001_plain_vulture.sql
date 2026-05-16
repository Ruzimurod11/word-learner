CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "words_english_unique_idx";--> statement-breakpoint
DELETE FROM "words";--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "unit_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "books_order_unique_idx" ON "books" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "units_book_order_unique_idx" ON "units" USING btree ("book_id","order");--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "words_unit_english_unique_idx" ON "words" USING btree ("unit_id","english");