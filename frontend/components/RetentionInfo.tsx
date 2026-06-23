"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { useContracts } from "@/lib/contracts";

/**
 * RNF-L01 — Retención impositiva del proveedor (lectura on-chain).
 *
 * Muestra la retención configurada para este proveedor (en %) que el escrow
 * descuenta de su parte y gira a la cuenta recaudadora al confirmar el servicio.
 * Default 0% (la fija el owner/plataforma según la jurisdicción).
 */
export function RetentionInfo({ provider }: { provider: Address }) {
  const { escrow } = useContracts();
  const { data } = useReadContract({
    ...escrow,
    functionName: "providerRetentionBps",
    args: [provider],
  });

  const bps = data ? Number(data) : 0;
  const pct = (bps / 100).toFixed(bps % 100 === 0 ? 0 : 2);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">Retención impositiva (RNF-L01):</span>{" "}
      {bps > 0 ? (
        <>
          <span className="font-semibold text-brand-dark">{pct}%</span> de tu parte se retiene y se
          gira a la cuenta recaudadora al liberar los fondos.
        </>
      ) : (
        <>
          <span className="font-semibold">0%</span> — sin retención configurada (la fija la
          plataforma según tu jurisdicción).
        </>
      )}
    </div>
  );
}
