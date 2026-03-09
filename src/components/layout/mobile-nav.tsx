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
      <div className="flex items-center rounded-full border border-border/50 bg-background/80 p-1 sm:hidden">
        <SearchTrigger
          variant="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        />
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={translations.menu}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">{translations.menu}</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent side="right" className="w-[280px] border-l border-border/60 px-5">
        <SheetHeader className="px-0 pt-2">
          <SheetTitle className="text-sm font-medium tracking-tight text-foreground">
            {translations.menu}
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1.5 px-0 text-sm text-muted-foreground">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            {translations.home}
          </Link>
          <Link
            href="/memo"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60 hover:text-foreground"
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
              className="rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
