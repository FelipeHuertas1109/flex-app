import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-teal/50 bg-linear-to-r from-cyan-400 via-teal to-indigo text-white shadow-lg shadow-teal/25 before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_45%)] hover:-translate-y-0.5 hover:border-cyan-200/70 hover:shadow-xl hover:shadow-cyan-400/25 active:translate-y-0 focus-visible:outline-ring",
  secondary:
    "border border-cyan-300/20 bg-white/5 text-foreground shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:shadow-cyan-400/10 active:translate-y-0 focus-visible:outline-ring",
  ghost:
    "border border-transparent text-muted hover:border-cyan-300/20 hover:bg-white/6 hover:text-foreground active:bg-white/10 focus-visible:outline-ring",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 text-sm font-bold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
