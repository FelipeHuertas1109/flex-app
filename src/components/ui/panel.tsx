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
        "rounded-lg border border-border/70 bg-surface shadow-lg shadow-black/6 ring-1 ring-black/2",
        className,
      )}
    >
      {children}
    </section>
  );
}
