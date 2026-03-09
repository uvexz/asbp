import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface BlogFooterProps {
  siteTitle: string;
}

export async function BlogFooter({ siteTitle }: BlogFooterProps) {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations("blog");

  return (
    <footer className="border-t border-border/40 py-8">
      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground/80">
          © {currentYear} {siteTitle}. {t("allRightsReserved")}
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="https://github.com/uvexz/asbp"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <Link href="/feed.xml" className="transition-colors hover:text-foreground">
            RSS
          </Link>
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
