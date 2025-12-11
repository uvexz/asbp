CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"siteTitle" text DEFAULT 'My Awesome Blog',
	"siteDescription" text DEFAULT 'A blog about tech...',
	"allowRegistration" boolean DEFAULT true
);
