"use client";

import Link from "next/link";
import { navItems } from "@/lib/constants/navItems";
import { DropdownMenuAvatar } from "../supporting/DropdownMenuAvatar";
import { ModeToggle } from "../ui/modetoggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/40 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            DevScreen
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <DropdownMenuAvatar />
        </div>
      </nav>
    </header>
  );
}
