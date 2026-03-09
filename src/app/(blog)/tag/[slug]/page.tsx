import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment, cache } from "react";
import { getPostsByTag } from "@/app/actions/tags";
import { formatLocalizedDate } from "@/lib/date-utils";
import { getLocale, getTranslations } from "next-intl/server";
import { getSettings } from "@/app/actions/settings";

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
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {t("postsTagged", { tag: tag.name })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {posts.length === 1
            ? t("postFound")
            : t("postsFound", { count: posts.length })}
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="divide-y divide-border/40">
          {posts.map((post) => (
            <article key={post.id} className="py-7 first:pt-0 last:pb-0">
              <div className="space-y-2.5">
                <Link
                  href={`/${post.slug}`}
                  className="block text-2xl font-medium tracking-tight text-foreground transition-colors hover:text-foreground/70"
                >
                  {post.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <p>{formatLocalizedDate(post.publishedAt || post.createdAt, locale)}</p>
                  {post.tags.length > 0 && (
                    <>
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-border/80" />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/90">
                        {post.tags.map((postTag, index) => (
                          <Fragment key={postTag.tag.id}>
                            {index > 0 && <span aria-hidden="true">/</span>}
                            <Link
                              href={`/tag/${postTag.tag.slug}`}
                              className="transition-colors hover:text-foreground"
                            >
                              {postTag.tag.name}
                            </Link>
                          </Fragment>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("noPostsWithTag")}</p>
      )}

      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("backToAllPosts")}
      </Link>
    </div>
  );
}
