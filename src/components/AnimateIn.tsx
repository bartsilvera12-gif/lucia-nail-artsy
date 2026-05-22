import type { ReactNode, CSSProperties } from "react";
import { useInView } from "@/hooks/useInView";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface AnimateInProps {
  children: ReactNode;
  delay?: number;        // ms
  duration?: number;     // ms
  distance?: number;     // px
  direction?: Direction;
  className?: string;
  threshold?: number;
}

function getHidden(direction: Direction, distance: number): CSSProperties {
  switch (direction) {
    case "up":    return { opacity: 0, transform: `translateY(${distance}px)` };
    case "down":  return { opacity: 0, transform: `translateY(-${distance}px)` };
    case "left":  return { opacity: 0, transform: `translateX(${distance}px)` };
    case "right": return { opacity: 0, transform: `translateX(-${distance}px)` };
    case "fade":  return { opacity: 0 };
  }
}

export function AnimateIn({
  children,
  delay = 0,
  duration = 600,
  distance = 28,
  direction = "up",
  className = "",
  threshold,
}: AnimateInProps) {
  const { ref, inView } = useInView(threshold);

  const hidden = getHidden(direction, distance);
  const visible: CSSProperties = { opacity: 1, transform: "translate(0,0)" };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(inView ? visible : hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
