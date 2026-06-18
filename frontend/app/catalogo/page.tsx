"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { isAddress, type Address } from "viem";
import { usePackages } from "@/lib/contracts";
import { PackageCard } from "@/components/PackageCard";
import { UsdcBalance } from "@/components/UsdcBalance";
import { SearchBar, type DateRange, type Guests } from "@/components/SearchBar";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/lib/auth";
import { shortAddress } from "@/lib/format";

function Catalog() {
  const { user } = useAuth();
  const { packages, isLoading, refetch } = usePackages();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [guests, setGuests] = useState<Guests>({ adults: 2, children: 0 });

  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const agent: Address | undefined = ref && isAddress(ref) ? ref : undefined;

  const resultados = packages
    .filter((p) => p.active)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          Hola{user ? `, ${user.name.split(" ")[0]}` : ""} 👋 Encontrá tu próxima experiencia
        </h1>
        <p className="text-sm text-slate-500">
          Reservás directo del proveedor. El pago queda en escrow y se reparte solo cuando confirman
          el servicio.
        </p>
      </div>

      <div className="relative z-30 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SearchBar
          query={query}
          onQuery={setQuery}
          range={range}
          onRange={setRange}
          guests={guests}
          onGuests={setGuests}
        />
      </div>

      {agent && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm text-brand-dark">
          🔗 Comprás a través del agente{" "}
          <span className="font-mono font-semibold">{shortAddress(agent)}</span> — su comisión (12%)
          se paga sola al confirmarse el servicio.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          Paquetes disponibles
          {!isLoading && (
            <span className="ml-2 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-brand">
              {resultados.length}
            </span>
          )}
        </h2>
        <UsdcBalance />
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : resultados.length === 0 ? (
        <EmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((pkg, i) => (
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
        <div
          key={i}
          className="h-72 animate-pulse rounded-2xl border border-slate-200/70 bg-white"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      {hasQuery ? (
        <p className="font-medium text-slate-700">No encontramos paquetes con ese nombre.</p>
      ) : (
        <>
          <p className="font-semibold text-slate-700">No hay paquetes publicados todavía.</p>
          <p className="mt-1 text-sm text-slate-500">
            ¿Levantaste el nodo local y corriste{" "}
            <code className="rounded bg-slate-100 px-1">npm run deploy:local</code>? Verificá que tu
            wallet esté en la red Hardhat (chainId 31337).
          </p>
        </>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <AuthGate>
      <Suspense fallback={<p className="text-slate-400">Cargando…</p>}>
        <Catalog />
      </Suspense>
    </AuthGate>
  );
}
