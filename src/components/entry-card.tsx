import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** One note or one post, with the margin rule down its left edge. */
export function EntryCard({
  title,
  content,
  meta,
  actions,
}: {
  title: string;
  content?: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <Card className="margin-rule">
      <CardContent className="flex items-start gap-2 pl-14">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-medium break-words">{title}</p>
          {content && (
            <p className="mt-1 text-sm break-words text-muted-foreground">{content}</p>
          )}
          {meta && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">{meta}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
      </CardContent>
    </Card>
  );
}

/** Admin views list everyone's work, so each run of items names its owner. */
export function OwnerSection({
  name,
  email,
  count,
  children,
}: {
  name: string;
  email: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-heading text-sm font-medium">{name}</h2>
        <p className="font-mono text-xs text-muted-foreground">
          {email} · {count}
        </p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** Groups the current page of items by their owner, preserving server order. */
export function groupByOwner<T>(
  items: T[],
  ownerOf: (item: T) => { _id: string; name: string; email: string } | undefined
) {
  const groups: Array<{
    owner: { _id: string; name: string; email: string };
    items: T[];
  }> = [];

  for (const item of items) {
    const owner = ownerOf(item);
    if (!owner) continue;
    const existing = groups.find((g) => g.owner._id === owner._id);
    if (existing) existing.items.push(item);
    else groups.push({ owner, items: [item] });
  }

  return groups;
}
