interface Props { eyebrow?: string; title: string; description?: string; align?: "left" | "center"; }
export function SectionHeader({ eyebrow, title, description, align = "center" }: Props) {
  return (
    <div className={"max-w-2xl " + (align === "center" ? "mx-auto text-center" : "")}>
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--rose-gold)]">
          <span aria-hidden className="inline-block h-px w-4 bg-gradient-to-r from-transparent to-[var(--rose-gold)]" />
          {eyebrow}
          <span aria-hidden className="inline-block h-px w-4 bg-gradient-to-l from-transparent to-[var(--rose-gold)]" />
        </p>
      )}
      <h2 className="mt-3 font-serif text-3xl text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base text-muted-foreground">{description}</p>}
    </div>
  );
}