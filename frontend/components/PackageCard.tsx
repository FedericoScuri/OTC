"use client";

import { useState } from "react";
import type { Address } from "viem";
import type { Package } from "@/lib/contracts";
import { BuyButton } from "./BuyButton";
import { categoryLabel, formatDate, formatUSDC, shortAddress } from "@/lib/format";

const CATEGORY_STYLE: Record<number, string> = {
  0: "from-blue-500 to-sky-400", // Hotel
  1: "from-purple-500 to-fuchsia-400", // Bodega
  2: "from-emerald-500 to-teal-400", // Aventura
  3: "from-amber-500 to-orange-400", // Cultural
};

export function PackageCard({
  pkg,
  agent,
  onPurchased,
  index = 0,
}: {
  pkg: Package;
  agent?: Address;
  onPurchased?: () => void;
  index?: number;
}) {
  const [qty, setQty] = useState(1);
  const available = Number(pkg.maxSupply - pkg.minted);
  const total = pkg.price * BigInt(qty);
  const soldRatio = Number(pkg.minted) / Math.max(Number(pkg.maxSupply), 1);

  return (
    <div
      className="glass card-hover group flex animate-fade-in-up flex-col gap-3 rounded-2xl p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full bg-gradient-to-r ${
            CATEGORY_STYLE[pkg.category] ?? "from-slate-400 to-slate-300"
          } px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm`}
        >
          {categoryLabel(pkg.category)}
        </span>
        <span className="text-xs font-medium text-slate-400">#{pkg.id}</span>
      </div>

      <h3 className="text-lg font-bold leading-tight text-slate-800 group-hover:text-brand-dark">
        {pkg.name}
      </h3>

      <dl className="space-y-1.5 text-sm text-slate-500">
        <div className="flex justify-between">
          <dt>Check-in</dt>
          <dd className="font-medium text-slate-700">{formatDate(pkg.checkInDate)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Reembolso hasta</dt>
          <dd className="font-medium text-slate-700">{formatDate(pkg.refundDeadline)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Proveedor</dt>
          <dd className="font-mono text-xs text-slate-600">{shortAddress(pkg.provider)}</dd>
        </div>
      </dl>

      {/* Barra de disponibilidad */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Disponibles</span>
          <span className="font-semibold text-slate-700">
            {available} / {Number(pkg.maxSupply)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500"
            style={{ width: `${Math.min(soldRatio * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-white/60 pt-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">Precio unitario</p>
            <p className="text-2xl font-extrabold text-gradient">{formatUSDC(pkg.price)}</p>
            <p className="-mt-1 text-xs font-medium text-slate-400">USDC</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Cant.</span>
            <input
              type="number"
              min={1}
              max={Math.max(available, 1)}
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(available || 1, Number(e.target.value) || 1)))
              }
              className="w-16 rounded-lg border border-white/70 bg-white/60 px-2 py-1 text-right font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>

        <p className="text-right text-sm text-slate-500">
          Total: <span className="font-bold text-slate-800">{formatUSDC(total)} USDC</span>
        </p>

        <BuyButton pkg={pkg} quantity={qty} agent={agent} onDone={onPurchased} />
      </div>
    </div>
  );
}
