"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cleanRiotIdPart, riotAccountPath } from "@/lib/riot/format";

type ExternalStatsButtonProps = {
  gameName: string;
  region: string;
  tagLine: string;
};

type PopoverPosition = {
  left: number;
  top: number;
  width: number;
};

const POPOVER_WIDTH = 360;
const POPOVER_HEIGHT = 174;
const POPOVER_GAP = 8;

function regionSlug(region: string, tagLine: string) {
  const normalizedRegion = cleanRiotIdPart(region).toLowerCase();
  if (normalizedRegion) return normalizedRegion;
  return cleanRiotIdPart(tagLine).toLowerCase() || "lan";
}

export function ExternalStatsButton({ gameName, region, tagLine }: ExternalStatsButtonProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const account = riotAccountPath(gameName, tagLine);
  const slug = regionSlug(region, tagLine);
  const leagueOfGraphsUrl = `https://www.leagueofgraphs.com/summoner/${slug}/${account}`;
  const opggUrl = `https://op.gg/lol/summoners/${slug}/${account}`;

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(POPOVER_WIDTH, viewportWidth - POPOVER_GAP * 2);
    const maxLeft = viewportWidth - width - POPOVER_GAP;
    const left = Math.min(
      Math.max(POPOVER_GAP, rect.right - width),
      Math.max(POPOVER_GAP, maxLeft),
    );
    const belowTop = rect.bottom + POPOVER_GAP;
    const aboveTop = rect.top - POPOVER_HEIGHT - POPOVER_GAP;
    const top = belowTop + POPOVER_HEIGHT <= viewportHeight - POPOVER_GAP
      ? belowTop
      : Math.max(POPOVER_GAP, aboveTop);

    setPosition({ left, top, width });
  };

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-cyan-300/36 bg-cyan-400/8 px-3 text-xs font-black text-cyan-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-200/65 hover:bg-cyan-400/14"
        onClick={() => {
          updatePosition();
          setOpen((current) => !current);
        }}
        type="button"
      >
        Stats
      </button>

      {open && position ? createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-xl border border-cyan-200/22 bg-[#07111f]/98 p-4 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/8"
          role="menu"
          style={{ left: position.left, top: position.top, width: position.width }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-black text-white">Stats externos</h3>
              <p className="mt-1 truncate text-sm font-semibold text-slate-400">
                {gameName}
                <span className="text-slate-500">#{tagLine}</span>
              </p>
            </div>
            <button
              aria-label="Cerrar stats externos"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-200/12 bg-white/[0.04] text-sm font-black text-slate-300 transition hover:border-cyan-200/40 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <a
              className="flex h-11 items-center justify-center rounded-lg border border-cyan-300/36 bg-cyan-400/10 px-4 text-sm font-black text-cyan-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-200/65 hover:bg-cyan-400/16"
              href={opggUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Abrir OP.GG
            </a>
            <a
              className="flex h-11 items-center justify-center rounded-lg border border-violet-300/36 bg-violet-500/10 px-4 text-sm font-black text-violet-100 shadow-lg shadow-violet-500/10 transition hover:border-violet-200/65 hover:bg-violet-500/16"
              href={leagueOfGraphsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Abrir League of Graphs
            </a>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
