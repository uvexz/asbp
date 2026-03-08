"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SearchTrigger } from "./search-dialog";

export type NavItemData = {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean | null;
  sortOrder: number;
};

interface MobileNavProps {
  navItems?: NavItemData[];
  translations: {
    home: string;
    memos: string;
    menu: string;
  };
}

export function MobileNav({ navItems = [], translations }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1 sm:hidden">
        <SearchTrigger variant="icon" />
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={translations.menu}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">{translations.menu}</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent side="right" className="w-[280px] px-4">
        <SheetHeader className="px-0">
          <SheetTitle>{translations.menu}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-0 text-sm">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-foreground transition-colors hover:bg-muted"
          >
            {translations.home}
          </Link>
          <Link
            href="/memo"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-foreground transition-colors hover:bg-muted"
          >
            {translations.memos}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-foreground transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
