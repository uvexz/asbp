import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment, cache } from "react";
import { getPostBySlug } from "@/app/actions/posts";
import { getPostComments } from "@/app/actions/comments";
import { getSettings } from "@/app/actions/settings";
import { CommentSection } from "@/components/layout/comment-section";
import { ArticleJsonLd } from "@/components/seo/json-ld";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { formatLocalizedDate } from "@/lib/date-utils";
import { getLocale } from "next-intl/server";

const loadPost = cache(async (slug: string) => getPostBySlug(slug));
const loadSettings = cache(async () => getSettings());

function getPostDescription(content: string) {
  return (
    content
      .replace(/[#*`>\[\]()!]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 160) + (content.length > 160 ? "..." : "")
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([loadPost(slug), loadSettings()]);
  const siteTitle = settings.siteTitle || "ASBP";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  if (!post) {
    return { title: `Not Found - ${siteTitle}` };
  }

  const description = getPostDescription(post.content);
  const keywords = post.tags.map((pt) => pt.tag.name);

  return {
    title: `${post.title} - ${siteTitle}`,
    description,
    keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: new Date(post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author.name],
      tags: keywords,
      url: `${baseUrl}/${post.slug}`,
      siteName: siteTitle,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${post.slug}`,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) {
    notFound();
  }

  const [comments, settings, locale] = await Promise.all([
    getPostComments(post.id),
    loadSettings(),
    getLocale(),
  ]);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={getPostDescription(post.content)}
        url={`${baseUrl}/${post.slug}`}
        datePublished={new Date(post.publishedAt || post.createdAt).toISOString()}
        dateModified={new Date(post.updatedAt).toISOString()}
        authorName={post.author.name}
        siteName={settings.siteTitle || "My Blog"}
        tags={post.tags.map((pt) => pt.tag.name)}
      />
      <div className="space-y-12 py-2 md:py-4">
        <article className="space-y-7">
          <header className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {post.author.name} · {formatLocalizedDate(post.publishedAt || post.createdAt, locale)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            {post.tags.length > 0 && (
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
            )}
          </header>
          <MarkdownContent
            content={post.content}
            className="prose-p:leading-8 prose-li:leading-8 prose-blockquote:text-foreground/80"
          />
        </article>
        <CommentSection postId={post.id} comments={comments} />
      </div>
    </>
  );
}
