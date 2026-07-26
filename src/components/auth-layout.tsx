import { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Shared frame for sign in and sign up. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Ruled paper, at page scale. */}
      <aside className="ruled-paper relative hidden flex-col justify-between border-r bg-secondary/40 p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-5 w-px bg-primary" />
          <span className="font-heading text-base font-semibold tracking-tight">
            Margin
          </span>
        </div>
        <div className="max-w-md">
          <h2 className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
            Notes stay where you put them.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Every note is tied to your account and visible only to you.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">margin · notes</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <span aria-hidden className="h-5 w-px bg-primary" />
            <span className="font-heading text-base font-semibold tracking-tight">
              Margin
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
          <div className="w-full max-w-sm">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">{description}</p>
            {children}
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
