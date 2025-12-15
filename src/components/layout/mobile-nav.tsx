"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Home, StickyNote, Newspaper } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{translations.menu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] px-4">
        <SheetHeader className="px-0">
          <SheetTitle>{translations.menu}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-4 px-0">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-neutral-700 text-base font-medium py-2 px-3 rounded-md hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <Home className="h-4 w-4" />
            {translations.home}
          </Link>
          <Link
            href="/memo"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-neutral-700 text-base font-medium py-2 px-3 rounded-md hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <StickyNote className="h-4 w-4" />
            {translations.memos}
          </Link>
          <Separator className="my-4" />
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-neutral-700 text-base font-medium py-2 px-3 rounded-md hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <Newspaper className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
