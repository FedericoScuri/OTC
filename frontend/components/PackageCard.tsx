"use client";

import { useState } from "react";
import type { Address } from "viem";
import type { Package } from "@/lib/contracts";
import { BuyButton } from "./BuyButton";
import { GaslessBuyButton } from "./GaslessBuyButton";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { useAuth } from "@/lib/auth";
import { categoryLabel, formatDate, formatUSDC, isFree } from "@/lib/format";
import { MapPinIcon, StarIcon, HeartIcon, CheckIcon, WineIcon, BuildingIcon, MountainIcon, LandmarkIcon } from "./icons";

/**
 * Datos visuales por categoría. NOTA: la foto, la ubicación y el rating son
 * PLACEHOLDERS de demo (el contrato aún no guarda imagen/ubicación/reseñas).
 * Se derivan de forma estable por categoría/id para que no cambien entre renders.
 */
const CATEGORY_UI: Record<number, { grad: string; badge: string; loc: string; Icon: typeof WineIcon }> = {
  0: { grad: "from-[#6d5bd0] to-[#b06fb8]", badge: "text-[#4a2a8c]", loc: "Ciudad de Mendoza", Icon: BuildingIcon },
  1: { grad: "from-[#c0506e] to-[#e0915f]", badge: "text-[#9c2b48]", loc: "Luján de Cuyo", Icon: WineIcon },
  2: { grad: "from-[#4f7a6a] to-[#d98f5a]", badge: "text-[#2f6a4f]", loc: "Potrerillos", Icon: MountainIcon },
  3: { grad: "from-[#8a5cc0] to-[#d08fb0]", badge: "text-[#6b2f8c]", loc: "Área Fundacional", Icon: LandmarkIcon },
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
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const available = Number(pkg.maxSupply - pkg.minted);
  const ui = CATEGORY_UI[pkg.category] ?? CATEGORY_UI[0];
  const Icon = ui.Icon;

  // Placeholders de demo, estables por paquete.
  const rating = (4.3 + ((pkg.id * 7) % 7) / 10).toFixed(1);
  const reviews = 40 + ((pkg.id * 13) % 150);

  return (
    <div
      className="card-hover group flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* "Foto" del destino (placeholder por categoría) */}
      <div className={`relative h-28 bg-gradient-to-br ${ui.grad}`}>
        <span
          className={`absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold ${ui.badge}`}
        >
          {categoryLabel(pkg.category)}
        </span>
        <button
          onClick={() => setFav((v) => !v)}
          aria-label="Favorito"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-accent-dark transition hover:scale-110"
        >
          <HeartIcon size={15} className={fav ? "fill-accent-dark" : ""} />
        </button>
        <Icon size={34} className="absolute bottom-2 right-3 text-white/45" />
        <span className="absolute bottom-2 left-2.5 rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          #{pkg.id}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-tight text-slate-800">{pkg.name}</h3>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={13} /> {ui.loc}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <StarIcon size={13} className="text-accent" /> {rating}
            <span className="font-normal text-slate-400">({reviews})</span>
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckIcon size={13} /> Cancelación gratis hasta {formatDate(pkg.refundDeadline)}
          </span>
          <AvailabilityBadge packageId={pkg.id} />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {available > 0 ? (
              <>
                Quedan <span className="font-semibold text-slate-700">{available}</span>
              </>
            ) : (
              <span className="font-semibold text-accent-dark">Agotado</span>
            )}
          </span>
          {available > 1 && (
            <span className="inline-flex items-center gap-1.5">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Menos"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold text-slate-700">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(available, q + 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Más"
              >
                +
              </button>
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            {isFree(pkg.price) ? (
              <span className="text-xl font-extrabold text-emerald-600">Gratis</span>
            ) : (
              <>
                <span className="text-xl font-extrabold text-brand-dark">{formatUSDC(pkg.price)}</span>
                <span className="text-xs font-medium text-slate-400"> USDC</span>
                {qty > 1 && (
                  <p className="text-[11px] text-slate-400">
                    Total {formatUSDC(pkg.price * BigInt(qty))} USDC
                  </p>
                )}
              </>
            )}
          </div>
          <div className="w-[44%]">
            <BuyButton pkg={pkg} quantity={qty} agent={agent} onDone={onPurchased} />
          </div>
        </div>

        {/* Alternativa sin wallet: compra gasless vía Account Abstraction (RF-A01) */}
        {user && (
          <div className="mt-2">
            <GaslessBuyButton pkg={pkg} quantity={qty} agent={agent} />
          </div>
        )}
      </div>
    </div>
  );
}
