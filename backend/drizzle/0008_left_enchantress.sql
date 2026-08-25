CREATE TABLE "admin_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"display_name" text,
	"avatar" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
