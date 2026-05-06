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
        "rounded-2xl border border-[#1f2230] bg-[#11131a] p-5 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20",
        className,
      )}
    >
      {children}
    </section>
  );
}
