import Image from "next/image";
import type { LeagueAccount } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type RankBadgeProps = {
  account: LeagueAccount;
  className?: string;
};

const tierLabels: Record<LeagueAccount["tier"], string> = {
  UNRANKED: "Sin rango",
  IRON: "Hierro",
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

const tierStyles: Record<LeagueAccount["tier"], string> = {
  UNRANKED:
    "border-slate-500/70 bg-[#1a2635] text-slate-200 shadow-[0_0_0_1px_rgba(148,163,184,0.18),0_0_12px_rgba(148,163,184,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
  IRON:
    "border-zinc-400/75 bg-[#1f252b] text-zinc-100 shadow-[0_0_0_1px_rgba(161,161,170,0.2),0_0_12px_rgba(161,161,170,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
  BRONZE:
    "border-orange-500/80 bg-[#2b211a] text-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.2),0_0_14px_rgba(249,115,22,0.16),inset_0_1px_0_rgba(251,146,60,0.18)]",
  SILVER:
    "border-slate-300/78 bg-[#1c2734] text-slate-100 shadow-[0_0_0_1px_rgba(203,213,225,0.2),0_0_14px_rgba(203,213,225,0.14),inset_0_1px_0_rgba(226,232,240,0.2)]",
  GOLD:
    "border-amber-400/85 bg-[#2d2418] text-amber-100 shadow-[0_0_0_1px_rgba(245,184,63,0.25),0_0_15px_rgba(245,184,63,0.2),inset_0_1px_0_rgba(255,216,107,0.22)] font-bold",
  PLATINUM:
    "border-cyan-300/80 bg-[#152934] text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.22),0_0_14px_rgba(103,232,249,0.16),inset_0_1px_0_rgba(165,243,252,0.18)] font-bold",
  EMERALD:
    "border-emerald-400/82 bg-[#142b28] text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.24),0_0_15px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(110,231,183,0.2)] font-bold",
  DIAMOND:
    "border-sky-300/85 bg-[#17233d] text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.24),0_0_15px_rgba(125,211,252,0.18),inset_0_1px_0_rgba(186,230,253,0.2)] font-bold",
  MASTER:
    "border-fuchsia-300/82 bg-[#2b1838] text-fuchsia-100 shadow-[0_0_0_1px_rgba(240,171,252,0.23),0_0_15px_rgba(240,171,252,0.18),inset_0_1px_0_rgba(245,208,254,0.2)] font-bold",
  GRANDMASTER:
    "border-rose-300/82 bg-[#331824] text-rose-100 shadow-[0_0_0_1px_rgba(253,164,175,0.24),0_0_15px_rgba(253,164,175,0.18),inset_0_1px_0_rgba(254,205,211,0.2)] font-bold",
  CHALLENGER:
    "border-cyan-100/90 bg-[#142838] text-white shadow-[0_0_0_1px_rgba(207,250,254,0.25),0_0_16px_rgba(103,232,249,0.2),inset_0_1px_0_rgba(254,240,138,0.18)] font-bold",
};

const tierEmblems: Partial<Record<LeagueAccount["tier"], string>> = {
  IRON: "/emblem-small/emblem-iron.webp",
  BRONZE: "/emblem-small/emblem-bronze.webp",
  SILVER: "/emblem-small/emblem-silver.webp",
  GOLD: "/emblem-small/emblem-gold.webp",
  PLATINUM: "/emblem-small/emblem-platinum.webp",
  EMERALD: "/emblem-small/emblem-emerald.webp",
  DIAMOND: "/emblem-small/emblem-diamond.webp",
  MASTER: "/emblem-small/emblem-master.webp",
  GRANDMASTER: "/emblem-small/emblem-grandmaster.webp",
  CHALLENGER: "/emblem-small/emblem-challenger.webp",
};

export function RankBadge({ account, className }: RankBadgeProps) {
  const tierStyle = tierStyles[account.tier] ?? tierStyles.UNRANKED;
  const tierLabel = tierLabels[account.tier] ?? tierLabels.UNRANKED;
  const label = (account.division ? `${tierLabel} ${account.division}` : tierLabel).toUpperCase();
  const emblemSrc = tierEmblems[account.tier];

  return (
    <span
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-black leading-none tracking-[0.03em]",
        tierStyle,
        className,
      )}
    >
      {emblemSrc ? (
        <span className="relative size-7 shrink-0 overflow-hidden">
          <Image
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-auto w-28 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_0_7px_currentColor]"
            height={63}
            priority={false}
            src={emblemSrc}
            width={112}
          />
        </span>
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
