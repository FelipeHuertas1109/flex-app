import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "indigo" | "gold" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const tones: Record<BadgeTone, string> = {
  teal: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200 shadow-cyan-400/10",
  indigo: "border-violet-300/25 bg-violet-500/12 text-violet-200 shadow-violet-500/10",
  gold: "border-amber-300/30 bg-amber-400/12 text-amber-200 shadow-amber-400/10",
  danger: "border-pink-300/30 bg-pink-500/12 text-pink-200 shadow-pink-500/10",
  neutral: "border-slate-300/14 bg-white/6 text-slate-300 shadow-black/20",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-bold leading-none shadow-sm backdrop-blur",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
