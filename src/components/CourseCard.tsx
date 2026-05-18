import { Link } from "@tanstack/react-router";
import { Clock, Layers, Crown } from "lucide-react";
import type { Course } from "@/data/courses";
import { Button } from "@/components/ui/button";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
      <Link to="/curso/$slug" params={{ slug: course.slug }} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <img src={course.image} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {course.includedInMembership && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium backdrop-blur">
            <Crown className="h-3 w-3 text-primary" /> Membresía
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-widest text-primary">{course.category}</p>
        <h3 className="mt-2 font-serif text-xl">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {course.modules} módulos</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Desde</p>
            <p className="font-serif text-lg">USD {course.price}</p>
          </div>
          <Button variant="outlineGold" size="sm" asChild>
            <Link to="/curso/$slug" params={{ slug: course.slug }}>Ver curso</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}