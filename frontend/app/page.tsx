"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isAddress, type Address } from "viem";
import { usePackages } from "@/lib/contracts";
import { PackageCard } from "@/components/PackageCard";
import { UsdcBalance } from "@/components/UsdcBalance";
import { shortAddress } from "@/lib/format";

function Catalog() {
  const { packages, isLoading, refetch } = usePackages();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const agent: Address | undefined = ref && isAddress(ref) ? ref : undefined;
  const activos = packages.filter((p) => p.active);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="animate-fade-in-up overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-brand/90 via-brand to-brand-dark p-8 text-white shadow-2xl shadow-brand/20 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Marketplace descentralizado
            </span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Reservá turismo, sin intermediarios.
            </h1>
            <p className="text-white/80">
              El pago queda en escrow y se reparte automáticamente —{" "}
              <strong className="font-semibold text-white">85/12/3</strong> — solo cuando el
              proveedor confirma el servicio.
            </p>
          </div>
          <div className="shrink-0">
            <UsdcBalance />
          </div>
        </div>
      </section>

      {agent && (
        <div className="glass animate-fade-in flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-brand-dark">
          🔗 Comprás a través del agente{" "}
          <span className="font-mono font-semibold">{shortAddress(agent)}</span> — su comisión (12%)
          se paga sola al confirmarse el servicio.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Paquetes disponibles</h2>
        {!isLoading && (
          <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-500 backdrop-blur">
            {activos.length} {activos.length === 1 ? "paquete" : "paquetes"}
          </span>
        )}
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : activos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activos.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} agent={agent} onPurchased={refetch} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass h-72 animate-pulse rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass animate-fade-in-up rounded-2xl p-10 text-center">
      <p className="font-semibold text-slate-700">No hay paquetes publicados todavía.</p>
      <p className="mt-1 text-sm text-slate-500">
        ¿Levantaste el nodo local y corriste{" "}
        <code className="rounded bg-slate-100 px-1">npm run deploy:local</code>? Verificá también que
        tu wallet esté en la red Hardhat (chainId 31337).
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Cargando…</p>}>
      <Catalog />
    </Suspense>
  );
}
