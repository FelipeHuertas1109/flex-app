"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FxBrandMark } from "@/components/layout/fx-brand-mark";
import { LogoutIcon } from "@/components/icons/logout-icon";
import type { ShellUser } from "@/lib/auth/shell-user";
import { cn } from "@/lib/utils";

type NavIconName = "grid" | "mail" | "key" | "map";

const navItems: { label: string; icon: NavIconName; href: string }[] = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/mapa", label: "Team Builder", icon: "map" },
  { href: "/invitaciones", label: "Invitaciones", icon: "mail" },
  { href: "/key", label: "RIOT KEY", icon: "key" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarGlyph({ active, type }: { active: boolean; type: NavIconName }) {
  const className = active
    ? "size-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(25,216,255,0.55)]"
    : "size-5 text-slate-400 transition-colors duration-150 group-hover/nav:text-slate-200";
  const common = {
    "aria-hidden": true as const,
    className,
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (type === "grid") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <rect height="7" rx="1.4" width="7" x="3.5" y="3.5" />
        <rect height="7" rx="1.4" width="7" x="13.5" y="3.5" opacity="0.78" />
        <rect height="7" rx="1.4" width="7" x="3.5" y="13.5" opacity="0.78" />
        <rect height="7" rx="1.4" width="7" x="13.5" y="13.5" />
      </svg>
    );
  }

  if (type === "map") {
    return (
      <svg {...common}>
        <path d="M9 4.5 3.5 6.75v13L9 17.5l6 2 5.5-2.25v-13L15 6.5l-6-2Z" />
        <path d="M9 4.5v13" />
        <path d="M15 6.5v13" />
      </svg>
    );
  }

  if (type === "key") {
    return (
      <svg {...common}>
        <circle cx="8.25" cy="12" r="2.75" />
        <path d="M11 12h9" />
        <path d="M15.5 12v2.2" />
        <path d="M18.65 12v1.35" />
        <path d="m6.35 13.85-1.7 1.7" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4.25 6.5h15.5v11H4.25v-11Z" />
      <path d="m4.75 7 7.25 5.65L19.25 7" />
      <path d="m9.75 10.9-5 6.1" opacity="0.45" />
      <path d="m14.25 10.9 5 6.1" opacity="0.45" />
    </svg>
  );
}

export function AppSidebar({ user }: { user: ShellUser | null }) {
  const pathname = usePathname() ?? "/";
  const initial = (user?.displayName ?? "?").slice(0, 1).toUpperCase();

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        "group/sidebar fixed inset-y-0 left-0 z-40 flex w-14 flex-col overflow-hidden border-r border-cyan-200/12 bg-[#030816]/94 shadow-2xl shadow-black/40 backdrop-blur-2xl",
        "transition-[width] duration-300 ease-out motion-reduce:transition-none",
        "hover:w-56 focus-within:w-56",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-px bg-linear-to-b from-cyan-300/25 via-transparent to-violet-400/15" />

      <Link
        className="relative flex min-h-14 shrink-0 items-center justify-center gap-0 border-b border-cyan-200/10 px-1.5 py-2 transition-[padding] duration-300 group-hover/sidebar:justify-start group-hover/sidebar:gap-2 group-hover/sidebar:px-2.5"
        href="/"
      >
        <FxBrandMark density="sidebar" />
        <span className="hidden min-w-0 flex-1 truncate text-sm font-black tracking-tight text-white group-hover/sidebar:inline">
          Flex App
        </span>
      </Link>

      <div className="relative flex shrink-0 items-center justify-center gap-0 border-b border-cyan-200/10 px-2 py-3 group-hover/sidebar:justify-start group-hover/sidebar:gap-2 group-hover/sidebar:px-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-cyan-400/28">
          {user?.avatarUrl ? (
            <Image alt="" className="size-full object-cover" height={36} src={user.avatarUrl} width={36} />
          ) : (
            <span className="flex size-full items-center justify-center bg-white/10 text-sm font-black text-white">
              {initial}
            </span>
          )}
        </div>
        <div className="hidden min-w-0 flex-1 group-hover/sidebar:block">
          <p className="truncate text-sm font-bold text-white">{user?.displayName ?? "Sesión"}</p>
          <p className="truncate text-xs text-slate-400">{user?.email ?? ""}</p>
        </div>
      </div>

      <nav aria-label="Secciones" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              className={cn(
                "group/nav flex h-11 shrink-0 items-center rounded-lg border text-sm font-semibold transition-colors duration-150",
                "justify-center group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3",
                active
                  ? "border-cyan-300/24 bg-cyan-300/10 font-bold text-white shadow-lg shadow-cyan-400/10"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/6 hover:text-white",
              )}
              href={item.href}
              key={item.href}
            >
              <SidebarGlyph active={active} type={item.icon} />
              <span className="hidden truncate group-hover/sidebar:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-cyan-200/10 p-2">
        <form action="/auth/signout" method="post">
          <button
            aria-label="Cerrar sesión"
            className={cn(
              "flex h-11 w-full items-center rounded-lg border border-transparent text-sm font-bold text-slate-300 transition-colors",
              "justify-center hover:border-cyan-300/24 hover:bg-white/8 hover:text-white group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3",
            )}
            type="submit"
          >
            <LogoutIcon className="size-6 shrink-0 text-current" />
            <span className="hidden truncate group-hover/sidebar:inline">Salir</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
