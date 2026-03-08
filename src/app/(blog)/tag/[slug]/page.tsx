import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByTag } from "@/app/actions/tags";
import { Badge } from "@/components/ui/badge";
import { formatLocalizedDate } from "@/lib/date-utils";
import { getLocale, getTranslations } from "next-intl/server";
import { getSettings } from "@/app/actions/settings";
import type { Metadata } from "next";
import { cache } from "react";

const loadTagData = cache(async (slug: string) => getPostsByTag(slug));
const loadSettings = cache(async () => getSettings());

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [{ tag }, settings, t] = await Promise.all([
    loadTagData(slug),
    loadSettings(),
    getTranslations("blog"),
  ]);
  const siteTitle = settings.siteTitle || "My Blog";

  if (!tag) {
    return { title: `Not Found - ${siteTitle}` };
  }

  return {
    title: `${t("postsTagged", { tag: tag.name })} - ${siteTitle}`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ tag, posts }, t, locale] = await Promise.all([
    loadTagData(slug),
    getTranslations("blog"),
    getLocale(),
  ]);

  if (!tag) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("postsTagged", { tag: tag.name })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {posts.length === 1
            ? t("postFound")
            : t("postsFound", { count: posts.length })}
        </p>
      </header>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.id} className="space-y-3 border-b border-border/60 pb-8 last:border-b-0 last:pb-0">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {formatLocalizedDate(post.publishedAt || post.createdAt, locale)}
              </p>
              <Link
                href={`/${post.slug}`}
                className="block text-2xl font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/70"
              >
                {post.title}
              </Link>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((postTag) => (
                  <Link key={postTag.tag.id} href={`/tag/${postTag.tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-border/60 bg-transparent px-2.5 py-0.5 text-xs font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {postTag.tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
        {posts.length === 0 && (
          <p className="text-muted-foreground">{t("noPostsWithTag")}</p>
        )}
      </div>

      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("backToAllPosts")}
      </Link>
    </div>
  );
}
