ALTER TABLE "settings" ADD COLUMN "faviconUrl" text;--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comments_user_id_idx" ON "comment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "comments_status_idx" ON "comment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comment" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "posts_author_id_idx" ON "post" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "posts_published_idx" ON "post" USING btree ("published");--> statement-breakpoint
CREATE INDEX "posts_post_type_idx" ON "post" USING btree ("postType");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "post" USING btree ("createdAt");