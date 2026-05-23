import type { ReactNode } from "react";
export function GoldBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 rounded-full border border-[var(--rose-gold)]/50 bg-[var(--rose-gold)]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[var(--rose-gold)] " + className}>
      {children}
    </span>
  );
}
