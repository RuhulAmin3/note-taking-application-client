import { ReactNode } from "react";

/** An empty screen is an invitation to act, so it names the next step. */
export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="margin-rule rounded-xl border border-dashed py-10 pr-6 pl-14">
      <div className="mb-2 text-muted-foreground [&_svg]:size-5">{icon}</div>
      <p className="font-heading text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
