"use client";

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/**
 * A labelled control with a permanent slot for its error message, so text
 * appearing on a failed submit never shoves the submit button down the page.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      <p
        className="min-h-4 text-xs text-destructive"
        role={error ? "alert" : undefined}
      >
        {error}
      </p>
    </div>
  );
}

/** Form-level failures — a whole request rejected, not one bad field. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
