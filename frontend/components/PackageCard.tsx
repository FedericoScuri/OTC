"use client";

import { useState } from "react";
import type { Address } from "viem";
import type { Package } from "@/lib/contracts";
import { BuyButton } from "./BuyButton";
import { categoryLabel, formatDate, formatUSDC, shortAddress } from "@/lib/format";

const CATEGORY_STYLE: Record<number, string> = {
  0: "bg-blue-100 text-blue-700", // Hotel
  1: "bg-purple-100 text-purple-700", // Bodega
  2: "bg-emerald-100 text-emerald-700", // Aventura
  3: "bg-amber-100 text-amber-700", // Cultural
};

export function PackageCard({
  pkg,
  agent,
  onPurchased,
}: {
  pkg: Package;
  agent?: Address;
  onPurchased?: () => void;
}) {
  const [qty, setQty] = useState(1);
  const available = Number(pkg.maxSupply - pkg.minted);
  const total = pkg.price * BigInt(qty);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            CATEGORY_STYLE[pkg.category] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {categoryLabel(pkg.category)}
        </span>
        <span className="text-xs text-slate-400">#{pkg.id}</span>
      </div>

      <h3 className="text-lg font-semibold leading-tight">{pkg.name}</h3>

      <dl className="space-y-1 text-sm text-slate-500">
        <div className="flex justify-between">
          <dt>Check-in</dt>
          <dd className="font-medium text-slate-700">{formatDate(pkg.checkInDate)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Reembolso hasta</dt>
          <dd className="font-medium text-slate-700">{formatDate(pkg.refundDeadline)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Disponibles</dt>
          <dd className="font-medium text-slate-700">
            {available} / {Number(pkg.maxSupply)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Proveedor</dt>
          <dd className="font-mono text-xs text-slate-600">{shortAddress(pkg.provider)}</dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">Precio unitario</p>
            <p className="text-xl font-bold text-brand">{formatUSDC(pkg.price)} USDC</p>
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
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right"
            />
          </label>
        </div>

        <p className="text-right text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-800">{formatUSDC(total)} USDC</span>
        </p>

        <BuyButton pkg={pkg} quantity={qty} agent={agent} onDone={onPurchased} />
      </div>
    </div>
  );
}
