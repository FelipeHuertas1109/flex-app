"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIconName = "grid" | "nodes" | "rank" | "mail";

const navItems: { label: string; icon: NavIconName; href: string }[] = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "#", label: "Grupos", icon: "nodes" },
  { href: "#", label: "Cuentas", icon: "rank" },
  { href: "/invitaciones", label: "Invitaciones", icon: "mail" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ActiveNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="hidden items-center gap-2 md:flex" aria-label="Principal">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            className={
              active
                ? "group inline-flex h-11 items-center gap-2 rounded-lg border border-cyan-300/24 bg-cyan-300/10 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-400/10"
                : "group inline-flex h-11 items-center gap-2 rounded-lg border border-transparent px-4 text-sm font-semibold text-slate-400 transition duration-150 hover:border-white/10 hover:bg-white/6 hover:text-white"
            }
            href={item.href}
            key={item.label}
          >
            <NavIcon active={active} type={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ active, type }: { active: boolean; type: NavIconName }) {
  const className = active
    ? "size-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(25,216,255,0.55)]"
    : "size-5 text-slate-400 transition-colors duration-150 group-hover:text-slate-200";
  const common = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
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

  if (type === "nodes") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="2.35" />
        <circle cx="17" cy="7" r="2.35" />
        <circle cx="7" cy="17" r="2.35" />
        <circle cx="17" cy="17" r="2.35" />
      </svg>
    );
  }

  if (type === "rank") {
    return (
      <svg {...common}>
        <path d="m12 3.25 7.5 4.35v8.8L12 20.75 4.5 16.4V7.6L12 3.25Z" />
        <path d="m8.15 10.25 3.85-2.2 3.85 2.2" />
        <path d="m8.15 13.75 3.85 2.2 3.85-2.2" />
        <path d="M12 8.05v7.9" opacity="0.45" />
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
