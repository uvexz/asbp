import Link from "next/link";
import { Fragment } from "react";
import { getPublishedPosts } from "@/app/actions/posts";
import { Pagination } from "@/components/ui/pagination";
import { formatLocalizedDate } from "@/lib/date-utils";
import { getLocale, getTranslations } from "next-intl/server";

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = 10;
  const [t, locale] = await Promise.all([
    getTranslations("blog"),
    getLocale(),
  ]);

  const { posts, totalPages } = await getPublishedPosts(currentPage, pageSize);

  return (
    <div className="space-y-8">
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
        <p className="text-muted-foreground">{t("noPosts")}</p>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/"
      />
    </div>
  );
}
