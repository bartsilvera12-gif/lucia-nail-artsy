import { Link } from "@tanstack/react-router";
import { Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveCourseImage, type CourseRow } from "@/hooks/useCourses";
import { formatPYG } from "@/lib/format";

export function CourseCard({ course }: { course: CourseRow }) {
  const img = resolveCourseImage(course.image_path);
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[var(--blush)] bg-card shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5 hover:border-primary/40">
      <Link to="/curso/$slug" params={{ slug: course.slug }} className="relative block aspect-[16/7] overflow-hidden bg-muted">
        {img && (
          <img src={img} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        {course.included_in_membership && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--blush)]/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur text-foreground">
            <Crown className="h-2.5 w-2.5 text-primary" /> Membresía
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2">
        <p className="text-[10px] uppercase tracking-widest text-primary">{course.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.8rem] font-serif text-base">{course.title}</h3>
        <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">{course.short_description}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Desde</p>
            <p className="font-serif text-base">{formatPYG(course.price)}</p>
          </div>
          <Button variant="outlineGold" size="sm" asChild>
            <Link to="/curso/$slug" params={{ slug: course.slug }}>Ver curso</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
