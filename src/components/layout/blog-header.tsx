import Link from "next/link";
import { MobileNav, type NavItemData } from "./mobile-nav";
import { NavIconLink } from "./nav-icon-link";
import { getTranslations } from "next-intl/server";
import { Home, ScrollText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SearchTrigger } from "./search-dialog";

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
    <header className="flex items-center justify-between whitespace-nowrap sm:mt-20 mt-5 px-4 sm:px-8 py-4">
      <div className="flex items-center gap-4 text-foreground">
        <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">
          {siteTitle}
        </h2>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex flex-1 justify-end gap-8">
        <nav className="flex items-center gap-4">
          <NavIconLink href="/" label={t("home")}>
            <Home className="h-4 w-4" />
          </NavIconLink>
          <NavIconLink href="/memo" label={t("memos")}>
            <ScrollText className="h-4 w-4" />
          </NavIconLink>
          <SearchTrigger variant="icon" />
          <Separator orientation="vertical" />
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
              className="text-muted-foreground text-sm font-medium leading-normal hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <MobileNav navItems={navItems} translations={mobileTranslations} />
    </header>
  );
}
