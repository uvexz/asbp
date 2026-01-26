ALTER TABLE "comment" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "guestWebsite" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "resendFromEmail" text;