"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Hidden entirely when there is nothing to page through — the server reports
 * totalPages 0 for an empty collection, which should never reach the reader.
 */
export function Pager({
  page,
  totalPages,
  total,
  unit,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  unit: string;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="font-mono text-xs text-muted-foreground">
        Page {page} of {totalPages}
        {typeof total === "number" && ` · ${total} ${unit}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
