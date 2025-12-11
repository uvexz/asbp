CREATE TABLE "nav_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"openInNewTab" boolean DEFAULT false,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "postType" text DEFAULT 'post';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "s3Bucket" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "s3Region" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "s3AccessKey" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "s3SecretKey" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "s3Endpoint" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "resendApiKey" text;