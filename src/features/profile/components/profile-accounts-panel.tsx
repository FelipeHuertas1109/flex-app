"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccount, setAccountMainStatus } from "@/features/accounts/actions";

type ProfileAccountItem = {
  id: string;
  riotId: string;
  region: string;
  isMain: boolean;
  isShared: boolean;
  soloTier: string;
  soloDivision: "I" | "II" | "III" | "IV" | null;
  soloLp: number;
  soloWinRate: number;
  soloTotalGames: number;
};

type ProfileAccountsPanelProps = {
  groupName: string;
  accounts: ProfileAccountItem[];
};

export function ProfileAccountsPanel({ groupName, accounts }: ProfileAccountsPanelProps) {
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.riotId.localeCompare(b.riotId));
  }, [accounts]);

  const onToggleMain = (account: ProfileAccountItem) => {
    setError(null);
    setPendingAccountId(account.id);
    startTransition(async () => {
      const result = await setAccountMainStatus(account.id, !account.isMain);
      if (result.error) {
        setError(result.error);
      }
      setPendingAccountId(null);
    });
  };

  const onDelete = (account: ProfileAccountItem) => {
    if (!confirm(`Se eliminara ${account.riotId} del grupo ${groupName}. Deseas continuar?`)) return;
    setError(null);
    setPendingAccountId(account.id);
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.error) {
        setError(result.error);
      }
      setPendingAccountId(null);
    });
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-300/28 bg-cyan-400/6 p-6 text-sm text-slate-300">
        Aun no has creado cuentas en este grupo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-pink-400/35 bg-pink-500/10 px-3 py-2 text-sm font-medium text-pink-200">{error}</p>
      ) : null}
      {sortedAccounts.map((account) => {
        const rowPending = isPending && pendingAccountId === account.id;
        const soloRank =
          account.soloTier === "UNRANKED"
            ? "Unranked"
            : `${account.soloTier}${account.soloDivision ? ` ${account.soloDivision}` : ""}`;

        return (
          <article
            className="rounded-lg border border-cyan-200/12 bg-white/3 px-3 py-2.5 shadow-lg shadow-black/20"
            key={account.id}
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                className="min-w-0 flex-1 text-left"
                href={`/perfil/cuenta/${account.id}`}
              >
                <p className="truncate text-sm font-black text-white">{account.riotId}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                  <span className="text-slate-400">{account.region}</span>
                  <span className="font-semibold text-slate-200">SoloQ: {soloRank}</span>
                  <span className="font-semibold text-slate-200">LP: {account.soloLp}</span>
                  <span className="font-semibold text-slate-200">
                    WR: {account.soloWinRate}% ({account.soloTotalGames})
                  </span>
                  {account.isShared ? <span className="font-semibold text-amber-300">Compartida</span> : null}
                  {account.isMain ? <span className="font-semibold text-cyan-300">Principal</span> : null}
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                <IconActionButton
                  ariaLabel={account.isMain ? "Quitar cuenta principal" : "Marcar como cuenta principal"}
                  disabled={rowPending}
                  onClick={() => onToggleMain(account)}
                  tone={account.isMain ? "teal" : "neutral"}
                  title={account.isMain ? "Quitar principal" : "Marcar principal"}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ★
                  </span>
                </IconActionButton>
                <IconActionButton
                  ariaLabel="Eliminar cuenta"
                  disabled={rowPending}
                  onClick={() => onDelete(account)}
                  tone="danger"
                  title="Eliminar cuenta"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    🗑
                  </span>
                </IconActionButton>
              </div>
            </div>
            {rowPending ? (
              <div className="mt-1.5">
                <p className="text-xs font-medium text-cyan-200">Actualizando...</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function IconActionButton({
  ariaLabel,
  children,
  disabled,
  onClick,
  title,
  tone,
}: {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  tone: "teal" | "neutral" | "danger";
}) {
  const toneClass =
    tone === "teal"
      ? "border-cyan-300/40 bg-cyan-400/12 text-cyan-100 hover:border-cyan-200/70 hover:bg-cyan-300/18"
      : tone === "danger"
        ? "border-pink-300/38 bg-pink-500/10 text-pink-200 hover:border-pink-200/70 hover:bg-pink-500/18"
        : "border-cyan-200/25 bg-white/8 text-slate-200 hover:border-cyan-300/45 hover:bg-white/12";

  return (
    <Button
      aria-label={ariaLabel}
      className={`h-9 w-9 rounded-lg p-0 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

