import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-white shadow-sm shadow-black/10 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-md hover:shadow-teal/15 active:translate-y-0 focus-visible:outline-ring",
  secondary:
    "border border-border bg-surface/90 text-foreground shadow-sm shadow-black/[0.03] hover:-translate-y-0.5 hover:border-teal/50 hover:bg-teal-soft/60 hover:shadow-md hover:shadow-teal/10 active:translate-y-0 focus-visible:outline-ring",
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
