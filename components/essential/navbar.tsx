"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/modetoggle";
import { authClient } from "@/lib/auth/auth-client";
import { navItems } from "@/lib/constants/navItems";

export default function Navbar() {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/40 backdrop-blur-sm">
      <nav className="flex h-14 items-center justify-around px-4 max-w-7xl mx-auto">
        <div>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            DevScreen
          </Link>
        </div>
        <main className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </main>
        <main className="flex items-center gap-4">
          <ModeToggle />
          {session ? (
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </main>
      </nav>
    </header>
  );
}
