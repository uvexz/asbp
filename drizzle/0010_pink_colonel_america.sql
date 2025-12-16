CREATE TABLE "email_whitelist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_whitelist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "aiBaseUrl" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "aiApiKey" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "aiModel" text;