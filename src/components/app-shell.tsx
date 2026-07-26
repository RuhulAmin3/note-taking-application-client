"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/notes", label: "Notes" },
  { href: "/posts", label: "Posts" },
];

function Wordmark() {
  return (
    <Link href="/notes" className="flex items-center gap-2.5">
      {/* The margin rule, standing in as the mark. */}
      <span aria-hidden className="h-5 w-px bg-primary" />
      <span className="font-heading text-base font-semibold tracking-tight">
        Margin
      </span>
    </Link>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2 py-1 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

/**
 * Chrome shared by every signed-in page: the header, the page gutters, and the
 * redirect for anyone who shouldn't be here.
 */
export function AppShell({
  title,
  description,
  action,
  requireAdmin = false,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  requireAdmin?: boolean;
  children: ReactNode;
}) {
  const { user, token, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/login");
    else if (requireAdmin && user && user.role !== "admin") router.replace("/notes");
  }, [ready, token, user, requireAdmin, router]);

  const allowed = token && (!requireAdmin || user?.role === "admin");

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Wordmark />
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {user?.role === "admin" && <NavLink href="/admin/users" label="Admin" />}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user && (
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {user.email}
              </span>
            )}
            <ThemeToggle />
            {/* The label costs more width than a narrow header can spare. */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={signOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>

        {!ready || !allowed ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
