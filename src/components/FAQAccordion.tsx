import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
              <span className="font-serif text-base sm:text-lg">{item.q}</span>
              {isOpen ? <Minus className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            </button>
            {isOpen && <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}