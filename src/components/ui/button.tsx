import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-r from-teal to-indigo text-white shadow-md shadow-teal/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal/35 active:translate-y-0 focus-visible:outline-ring",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm shadow-black/5 hover:-translate-y-0.5 hover:border-teal/45 hover:bg-teal-soft/40 hover:shadow-md hover:shadow-teal/10 active:translate-y-0 focus-visible:outline-ring",
  ghost:
    "text-muted hover:bg-surface-muted hover:text-foreground active:bg-border/60 focus-visible:outline-ring",
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
