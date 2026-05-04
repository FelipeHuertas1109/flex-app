import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "indigo" | "gold" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const tones: Record<BadgeTone, string> = {
  teal: "bg-teal-soft text-teal",
  indigo: "bg-indigo-soft text-indigo",
  gold: "bg-gold-soft text-gold",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-muted",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
