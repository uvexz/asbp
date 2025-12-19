import { Badge } from "@/components/ui/badge";
import { getPostBySlug } from "@/app/actions/posts";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostComments } from "@/app/actions/comments";
import { CommentSection } from "@/components/layout/comment-section";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatDate } from "@/lib/date-utils";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/app/actions/settings";
import type { Metadata } from "next";
import { Calendar, CircleUser, Tag } from "lucide-react";
import { ArticleJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const settings = await getSettings();
  const siteTitle = settings.siteTitle || "ASBP";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  if (!post) {
    return { title: `Not Found - ${siteTitle}` };
  }

  // Extract description from content (first 160 chars)
  const description =
    post.content
      .replace(/[#*`>\[\]()!]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 160) + (post.content.length > 160 ? "..." : "");

  // Extract keywords from tags
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
  const post = await getPostBySlug(slug);
  const t = await getTranslations("blog");

  if (!post) {
    notFound();
  }

  const comments = await getPostComments(post.id);

  // Get current user session
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const currentUser = session?.user
    ? {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    }
    : null;
  const isAdmin = session?.user?.role === 'admin';

  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.content.replace(/[#*`>\[\]()!]/g, "").slice(0, 160)}
        url={`${baseUrl}/${post.slug}`}
        datePublished={new Date(post.publishedAt || post.createdAt).toISOString()}
        dateModified={new Date(post.updatedAt).toISOString()}
        authorName={post.author.name}
        siteName={settings.siteTitle || "My Blog"}
        tags={post.tags.map((pt) => pt.tag.name)}
      />
      <div className="space-y-16 py-6 md:py-16 w-full overflow-x-hidden">
        <article className="space-y-8 overflow-hidden">
          <header className="space-y-4">
            <h1 className="text-black dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em] uppercase">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-neutral-500 text-sm font-normal leading-none flex items-center gap-1">
                <CircleUser className="h-3 w-3" />
                {post.author.name}
                <Calendar className="ms-2 h-3 w-3" />
                {formatDate(post.publishedAt || post.createdAt)}
              </p>
              {post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {post.tags.map((postTag) => (
                    <Link key={postTag.tag.id} href={`/tag/${postTag.tag.slug}`}>
                      <Badge
                        variant="secondary"
                        className="hover:bg-neutral-200 transition-colors leading-none"
                      >
                        <Tag className="h-3 w-3 text-neutral-500" />{" "}
                        {postTag.tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </header>
          <MarkdownContent
            content={post.content}
            className="prose prose-neutral prose-base md:prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline prose-img:rounded-lg prose-img:shadow-md prose-img:border prose-img:border-neutral-200 dark:prose-img:border-neutral-800 prose-pre:bg-neutral-900 prose-pre:text-neutral-50 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:bg-neutral-900 prose-code:text-neutral-50 prose-code:font-light prose-code:text-sm prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-table:w-full prose-table:table-auto prose-table:border-collapse prose-thead:w-full prose-thead:table-auto prose-thead:min-w-max prose-th:border prose-th:border-neutral-200 dark:prose-th:border-neutral-800 prose-th:p-2 prose-td:border prose-td:border-neutral-200 dark:prose-td:border-neutral-800 prose-td:p-2 [&_pre]:max-w-full"
          />
        </article>
        <div className="border-t border-border pt-12">
          <CommentSection
            postId={post.id}
            comments={comments}
            user={currentUser}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </>
  );
}
