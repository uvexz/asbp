ALTER TABLE "settings" ADD COLUMN "umamiEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiCloud" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiHostUrl" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiWebsiteId" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiApiKey" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiApiUserId" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "umamiApiSecret" text;