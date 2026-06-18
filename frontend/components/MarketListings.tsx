"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "@/lib/wagmi";
import { useContracts, useListings, usePackages, type Listing, type Package } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { formatUSDC, formatDate, categoryLabel, shortAddress } from "@/lib/format";

// Reparto de la reventa (igual que las constantes del contrato SecondaryMarket).
const ROYALTY_BPS = 500n; // 5% al proveedor original
const PLATFORM_BPS = 200n; // 2% a la plataforma
const TOTAL_BPS = 10000n;

/**
 * Vitrina del mercado secundario: publicaciones activas de otros usuarios.
 * Al comprar (RF-C02) se aplica automáticamente el royalty al proveedor y el
 * fee a la plataforma; el resto va al vendedor.
 */
export function MarketListings() {
  const { address } = useAccount();
  const { listings, isLoading, refetch } = useListings();
  const { packages } = usePackages();

  const activas = listings.filter((l) => l.active && l.quantity > 0n);

  if (isLoading) return <p className="text-slate-400">Cargando reventas…</p>;

  if (activas.length === 0) {
    return (
      <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
        No hay reservas en reventa por ahora.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {activas.map((l) => {
        const pkg = packages.find((p) => p.id === Number(l.packageId));
        const mine = address?.toLowerCase() === l.seller.toLowerCase();
        return (
          <ListingCard key={l.id} listing={l} pkg={pkg} mine={mine} onDone={refetch} />
        );
      })}
    </div>
  );
}

function ListingCard({
  listing,
  pkg,
  mine,
  onDone,
}: {
  listing: Listing;
  pkg?: Package;
  mine: boolean;
  onDone: () => void;
}) {
  const { isConnected, address } = useAccount();
  const { usdc, market } = useContracts();
  const { run, pending, error } = useTx();
  const [qty, setQty] = useState(1);

  const disponibles = Number(listing.quantity);
  const total = listing.pricePerUnit * BigInt(qty);
  const royalty = (total * ROYALTY_BPS) / TOTAL_BPS;
  const fee = (total * PLATFORM_BPS) / TOTAL_BPS;
  const alVendedor = total - royalty - fee;

  async function comprar() {
    if (!address) return;

    // 1. Allowance de USDC hacia el mercado.
    const allowance = (await readContract(config, {
      ...usdc,
      functionName: "allowance",
      args: [address, market.address],
    })) as bigint;

    if (allowance < total) {
      const ok = await run({ ...usdc, functionName: "approve", args: [market.address, total] });
      if (!ok) return;
    }

    // 2. Compra de la reventa.
    await run(
      { ...market, functionName: "buy", args: [BigInt(listing.id), BigInt(qty)] },
      onDone,
    );
  }

  return (
    <div className="glass card-hover flex flex-col gap-3 rounded-2xl p-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-dark">
            {pkg ? categoryLabel(pkg.category) : "Paquete"} · reventa
          </span>
          <span className="text-xs text-slate-400">#{listing.id}</span>
        </div>
        <p className="mt-2 font-semibold leading-tight">{pkg ? pkg.name : `Paquete #${Number(listing.packageId)}`}</p>
        {pkg && <p className="text-xs text-slate-500">viaje {formatDate(pkg.checkInDate)}</p>}
        <p className="mt-1 text-xs text-slate-500">
          Vende {shortAddress(listing.seller)} · {disponibles} u. disponibles
        </p>
      </div>

      <p className="text-lg font-bold text-brand">{formatUSDC(listing.pricePerUnit)} USDC <span className="text-xs font-normal text-slate-400">c/u</span></p>

      {/* Desglose del reparto forzoso de la reventa */}
      <div className="rounded-lg bg-slate-50/70 p-2 text-[11px] text-slate-500">
        <div className="flex justify-between"><span>Royalty proveedor (5%)</span><span>{formatUSDC(royalty)}</span></div>
        <div className="flex justify-between"><span>Fee plataforma (2%)</span><span>{formatUSDC(fee)}</span></div>
        <div className="flex justify-between font-medium text-slate-700"><span>Al vendedor</span><span>{formatUSDC(alVendedor)}</span></div>
      </div>

      {mine ? (
        <p className="rounded-lg bg-slate-50 py-2 text-center text-xs text-slate-400">
          Es tu publicación
        </p>
      ) : !isConnected ? (
        <p className="rounded-lg bg-slate-50 py-2 text-center text-xs text-slate-400">
          Conectá tu wallet
        </p>
      ) : (
        <div className="flex items-center gap-2">
          {disponibles > 1 && (
            <input
              type="number"
              min="1"
              max={disponibles}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(disponibles, Number(e.target.value))))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 outline-none focus:border-brand"
            />
          )}
          <button onClick={comprar} disabled={pending} className="btn-accent flex-1">
            {pending ? "Comprando…" : `Comprar (${formatUSDC(total)})`}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
