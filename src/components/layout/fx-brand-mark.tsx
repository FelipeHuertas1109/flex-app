import { cn } from "@/lib/utils";

type FxBrandMarkProps = {
  className?: string;
  /** `sidebar`: caja y padding acotados al ancho de la barra (w-14). */
  density?: "default" | "sidebar";
};

/** Mismo marcador FX que en `/login`: caja neon + texto (no PNG/SVG de archivo). */
export function FxBrandMark({ className, density = "default" }: FxBrandMarkProps) {
  return (
    <div
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/35 bg-[#071a33] font-black text-white shadow-xl shadow-cyan-500/20",
        density === "sidebar"
          ? "size-11 p-1 text-xl leading-none tracking-tight"
          : "size-14 p-1.5 text-xl leading-none tracking-tight",
        className,
      )}
    >
      <span
        className={cn(
          "absolute rounded-full bg-cyan-300/45 blur-xl",
          density === "sidebar" ? "-left-2 -top-2 size-8" : "-left-3 -top-3 size-11",
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 rounded-full bg-violet-500/55 blur-xl",
          density === "sidebar" ? "-right-3 size-8" : "-right-4 size-11",
        )}
      />
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(25,216,255,0.42),transparent_42%,rgba(124,60,255,0.42))]" />
      <span className="relative z-10">FX</span>
    </div>
  );
}
