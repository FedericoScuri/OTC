"use client";

import { useEffect, useState } from "react";
import { backend, type Availability } from "@/lib/backend";

/**
 * RNF-P01 / PDR §2.2 — Cupo en tiempo real desde el Guardián de Latencia.
 *
 * Consulta el cupo libre (supply on-chain − holds activos) y muestra la latencia
 * de la respuesta (presupuesto de 800ms). Si el backend no está corriendo, no
 * muestra nada (degradación silenciosa).
 */
export function AvailabilityBadge({ packageId }: { packageId: number }) {
  const [data, setData] = useState<Availability | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .get<Availability>(`/api/inventory/availability/${packageId}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => {
        /* backend caído: no mostramos el badge */
      });
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  if (!data) return null;

  const tight = data.held > 0;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"
      title={`Cupo on-chain ${data.available} − ${data.held} en hold = ${data.free} libres · sync ${data.latencyMs}ms (presupuesto ${data.budgetMs}ms)`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tight ? "bg-amber-500" : "bg-emerald-500"}`} />
      {data.free} libres
      {data.held > 0 && <span className="text-amber-600">· {data.held} en reserva</span>}
      <span className="text-slate-400">· {data.latencyMs}ms</span>
    </span>
  );
}
