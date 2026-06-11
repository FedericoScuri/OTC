"use client";

import { useMemo } from "react";
import { useContracts, usePackages } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { categoryLabel, formatUSDC } from "@/lib/format";

/** Lista los paquetes del proveedor conectado con toggle de activo/pausado. */
export function ProviderPackages({ provider }: { provider: `0x${string}` }) {
  const { nft } = useContracts();
  const { packages, isLoading, refetch } = usePackages();
  const { run, pending, error } = useTx();

  const propios = useMemo(
    () => packages.filter((p) => p.provider.toLowerCase() === provider.toLowerCase()),
    [packages, provider],
  );

  if (isLoading) return <p className="text-slate-400">Cargando paquetes…</p>;

  if (propios.length === 0) {
    return (
      <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
        Todavía no publicaste paquetes.
      </p>
    );
  }

  function toggle(id: number, active: boolean) {
    run({ ...nft, functionName: "setPackageActive", args: [BigInt(id), !active] }, refetch);
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {propios.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"
        >
          <div className="text-sm">
            <p className="font-semibold">
              #{p.id} · {p.name}
            </p>
            <p className="text-slate-500">
              {categoryLabel(p.category)} · {formatUSDC(p.price)} USDC ·{" "}
              {Number(p.minted)}/{Number(p.maxSupply)} vendidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {p.active ? "Activo" : "Pausado"}
            </span>
            <button
              onClick={() => toggle(p.id, p.active)}
              disabled={pending}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              {p.active ? "Pausar" : "Activar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
