"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { readContract } from "wagmi/actions";
import { config } from "@/lib/wagmi";
import { useContracts, useOwnedReservations, type OwnedReservation } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { formatUSDC, formatDate, categoryLabel } from "@/lib/format";
import { USDC_DECIMALS } from "@/lib/format";

/**
 * "Revender mi reserva" (RF-C02 desde la UI). Lista las reservas (NFTs) que
 * tiene el usuario y permite publicarlas en el mercado secundario:
 *   1. Si el mercado no está aprobado -> setApprovalForAll(market, true).
 *   2. list(packageId, cantidad, precioPorUnidad).
 */
export function ResellReservation({ owner }: { owner: `0x${string}` }) {
  const { owned, isLoading, refetch } = useOwnedReservations(owner);

  if (isLoading) return <p className="text-slate-400">Cargando tus reservas…</p>;

  if (owned.length === 0) {
    return (
      <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
        No tenés reservas para revender. Comprá un paquete en el catálogo y aparecerá acá.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {owned.map((o) => (
        <ResellCard key={o.pkg.id} item={o} owner={owner} onDone={refetch} />
      ))}
    </div>
  );
}

function ResellCard({
  item,
  owner,
  onDone,
}: {
  item: OwnedReservation;
  owner: `0x${string}`;
  onDone: () => void;
}) {
  const { nft, market } = useContracts();
  const { run, pending, error } = useTx();
  const { pkg, balance } = item;

  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);

  async function publicar() {
    const priceUnits = parseUnits(price || "0", USDC_DECIMALS);
    if (priceUnits <= 0n) return;

    // 1. ¿El mercado ya puede mover nuestros NFTs?
    const approved = (await readContract(config, {
      ...nft,
      functionName: "isApprovedForAll",
      args: [owner, market.address],
    })) as boolean;

    if (!approved) {
      const ok = await run({
        ...nft,
        functionName: "setApprovalForAll",
        args: [market.address, true],
      });
      if (!ok) return;
    }

    // 2. Publicamos la reventa.
    await run(
      {
        ...market,
        functionName: "list",
        args: [BigInt(pkg.id), BigInt(qty), priceUnits],
      },
      () => {
        setPrice("");
        setQty(1);
        onDone();
      },
    );
  }

  return (
    <div className="glass card-hover flex flex-col gap-3 rounded-2xl p-4">
      <div>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
          {categoryLabel(pkg.category)}
        </span>
        <p className="mt-2 font-semibold leading-tight">{pkg.name}</p>
        <p className="text-xs text-slate-500">
          Tenés {Number(balance)} u. · pagaste {formatUSDC(pkg.price)} USDC c/u · viaje{" "}
          {formatDate(pkg.checkInDate)}
        </p>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex-1 text-xs font-medium text-slate-600">
          Precio reventa (USDC c/u)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="w-20 text-xs font-medium text-slate-600">
          Cant.
          <input
            type="number"
            min="1"
            max={Number(balance)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(balance), Number(e.target.value))))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      <button
        onClick={publicar}
        disabled={pending || !price || Number(price) <= 0}
        className="btn-primary w-full"
      >
        {pending ? "Publicando…" : "Publicar en reventa"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
