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
        "rounded-lg border border-border/80 bg-surface/90 shadow-sm shadow-black/[0.04] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}
