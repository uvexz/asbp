import Link from "next/link";
import { MobileNav, type NavItemData } from "./mobile-nav";
import { getTranslations } from "next-intl/server";
import { SearchDialogProvider, SearchTrigger } from "./search-dialog";

export type { NavItemData };

interface BlogHeaderProps {
  siteTitle: string;
  navItems?: NavItemData[];
}

export async function BlogHeader({
  siteTitle,
  navItems = [],
}: BlogHeaderProps) {
  const t = await getTranslations("blog");

  const mobileTranslations = {
    home: t("home"),
    memos: t("memos"),
    menu: t("menu"),
  };

  return (
    <SearchDialogProvider>
      <header className="flex items-center justify-between gap-6 border-b border-border/60 py-6 md:py-10">
        <Link
          href="/"
          className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/70"
        >
          {siteTitle}
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              {t("home")}
            </Link>
            <Link href="/memo" className="transition-colors hover:text-foreground">
              {t("memos")}
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SearchTrigger variant="default" />
        </div>

        <MobileNav navItems={navItems} translations={mobileTranslations} />
      </header>
    </SearchDialogProvider>
  );
}
