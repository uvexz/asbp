import Link from "next/link";
import { getPublishedPosts } from "@/app/actions/posts";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-10">
      <div className="space-y-10">
        {posts.map((post) => (
          <article key={post.id} className="space-y-3 border-b border-border/60 pb-10">
            <div className="space-y-2">
              <Link
                href={`/${post.slug}`}
                className="block text-2xl font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/70"
              >
                {post.title}
              </Link>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {formatLocalizedDate(post.publishedAt || post.createdAt, locale)}
                </p>
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
              </div>

            </div>
          </article>
        ))}
        {posts.length === 0 && <p className="text-muted-foreground">{t("noPosts")}</p>}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/"
      />
    </div>
  );
}
