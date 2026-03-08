import { Badge } from "@/components/ui/badge";
import { getPostBySlug } from "@/app/actions/posts";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostComments } from "@/app/actions/comments";
import { CommentSection } from "@/components/layout/comment-section";
import { formatLocalizedDate } from "@/lib/date-utils";
import { getSettings } from "@/app/actions/settings";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/json-ld";
import { cache } from "react";

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
      <div className="space-y-14 py-4 md:py-8">
        <article className="space-y-8">
          <header className="space-y-4 border-b border-border/60 pb-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {post.author.name} · {formatLocalizedDate(post.publishedAt || post.createdAt, locale)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {post.title}
              </h1>
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
