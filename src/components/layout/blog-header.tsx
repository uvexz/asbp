import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MobileNav, type NavItemData } from "./mobile-nav";
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
      <header className="flex items-center justify-between gap-4 border-b border-border/40 py-5 md:py-7">
        <Link
          href="/"
          className="min-w-0 truncate text-base font-medium tracking-tight text-foreground transition-colors hover:text-foreground/70 md:text-[1.05rem]"
        >
          {siteTitle}
        </Link>

        <div className="hidden items-center gap-5 sm:flex">
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="whitespace-nowrap transition-colors hover:text-foreground">
              {t("home")}
            </Link>
            <Link href="/memo" className="whitespace-nowrap transition-colors hover:text-foreground">
              {t("memos")}
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                className="whitespace-nowrap transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SearchTrigger
            variant="icon"
            className="h-9 w-9 rounded-full border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          />
        </div>

        <MobileNav navItems={navItems} translations={mobileTranslations} />
      </header>
    </SearchDialogProvider>
  );
}
