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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de paquetes</h1>
          <p className="text-slate-500">
            Reservá experiencias turísticas. El pago queda en escrow y se reparte solo cuando el
            proveedor confirma el servicio.
          </p>
        </div>
        <UsdcBalance />
      </div>

      {agent && (
        <div className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand-dark">
          🔗 Comprás a través del agente{" "}
          <span className="font-mono font-semibold">{shortAddress(agent)}</span>. Su comisión (12%)
          se paga automáticamente al confirmarse el servicio.
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-400">Cargando paquetes…</p>
      ) : packages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages
            .filter((p) => p.active)
            .map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} agent={agent} onPurchased={refetch} />
            ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-700">No hay paquetes publicados todavía.</p>
      <p className="mt-1 text-sm text-slate-500">
        ¿Levantaste el nodo local y corriste <code className="rounded bg-slate-100 px-1">npm run deploy:local</code>?
        Verificá también que tu wallet esté en la red Hardhat (chainId 31337).
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
