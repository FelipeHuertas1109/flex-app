import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "neon-panel rounded-xl border border-cyan-200/12 bg-surface/78 shadow-2xl shadow-black/35 ring-1 ring-white/6 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}
