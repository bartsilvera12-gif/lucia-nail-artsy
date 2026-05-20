import { useState } from "react";
import { Plus } from "lucide-react";

export function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={
              "group overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 " +
              (isOpen
                ? "border-primary/40 shadow-elegant"
                : "border-border hover:border-primary/30 hover:shadow-elegant")
            }
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <div className="flex items-start gap-4">
                <span
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-serif text-xs transition-all " +
                    (isOpen
                      ? "bg-gradient-gold text-foreground shadow-gold"
                      : "border border-primary/30 bg-primary/10 text-primary group-hover:bg-gradient-gold group-hover:text-foreground")
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-base leading-snug sm:text-lg">{item.q}</span>
              </div>
              <span
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 " +
                  (isOpen
                    ? "rotate-45 border-primary bg-gradient-gold text-foreground"
                    : "border-border text-primary group-hover:border-primary")
                }
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </button>

            {/* contenido animado */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border/60 px-6 py-5 pl-[4.25rem] text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
