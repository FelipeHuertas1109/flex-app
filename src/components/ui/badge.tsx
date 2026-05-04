import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "indigo" | "gold" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const tones: Record<BadgeTone, string> = {
  teal: "border-teal/20 bg-teal-soft text-teal",
  indigo: "border-indigo/20 bg-indigo-soft text-indigo",
  gold: "border-gold/20 bg-gold-soft text-gold",
  danger: "border-danger/20 bg-danger-soft text-danger",
  neutral: "border-border bg-surface-muted text-muted",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
