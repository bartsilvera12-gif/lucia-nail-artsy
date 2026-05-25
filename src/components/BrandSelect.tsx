import { useState, useRef, useEffect } from "react";

export type BrandSelectOption = string | { value: string; label: string };

interface BrandSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: BrandSelectOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Dropdown custom estilizado con la paleta dorada del proyecto.
 * Reemplazo del <select> nativo (que muestra el feo azul del browser al abrir).
 */
export function BrandSelect({ value, onChange, options, placeholder = "Seleccionar…", className = "" }: BrandSelectProps) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = items.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(() =>
    Math.max(0, items.findIndex((o) => o.value === value))
  );
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      const i = items.findIndex((o) => o.value === value);
      setActiveIdx(i >= 0 ? i : 0);
    }
  }, [open, value, items]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "Enter" || e.key === " ") {
      if (!open) { setOpen(true); e.preventDefault(); return; }
      const opt = items[activeIdx];
      if (opt) { onChange(opt.value); setOpen(false); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActiveIdx((i) => (i + 1) % items.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActiveIdx((i) => (i - 1 + items.length) % items.length);
      return;
    }
  };

  return (
    <div ref={wrapRef} className={"relative " + className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm font-medium text-foreground shadow-sm transition-all " +
          (open
            ? "border-primary ring-2 ring-primary/30"
            : "border-input hover:border-primary/40")
        }
      >
        <span className={current ? "" : "text-muted-foreground"}>
          {current ? current.label : placeholder}
        </span>
        <svg
          aria-hidden="true"
          className={"h-4 w-4 shrink-0 text-muted-foreground transition-transform " + (open ? "rotate-180" : "")}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-lg border border-border bg-background p-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
        >
          {items.map((o, i) => {
            const isSel = o.value === value;
            const isActive = i === activeIdx;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors " +
                  (isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground hover:bg-primary/10") +
                  (isSel ? " font-semibold" : "")
                }
              >
                <span className="truncate">{o.label}</span>
                {isSel && (
                  <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
