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
        "rounded-lg border border-border bg-surface shadow-sm shadow-black/[0.03]",
        className,
      )}
    >
      {children}
    </section>
  );
}
