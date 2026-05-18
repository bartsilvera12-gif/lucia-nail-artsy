import type { ReactNode } from "react";
export function GoldBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-foreground/80 " + className}>
      {children}
    </span>
  );
}
