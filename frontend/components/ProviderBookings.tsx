"use client";

import { useMemo } from "react";
import { zeroAddress } from "viem";
import { useContracts, useBookings, type Booking } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { formatUSDC, formatDate, shortAddress } from "@/lib/format";

/**
 * Reservas pendientes del proveedor conectado. Permite:
 *   - Confirmar servicio -> libera el escrow y reparte 85/12/3 (RF-C01).
 *   - Cancelar y reembolsar al cliente (si todavía está dentro del plazo).
 */
export function ProviderBookings({ provider }: { provider: `0x${string}` }) {
  const { escrow } = useContracts();
  const { bookings, isLoading, refetch } = useBookings();
  const { run, pending, error } = useTx();

  const pendientes = useMemo(
    () =>
      bookings.filter(
        (b) => b.provider.toLowerCase() === provider.toLowerCase() && b.status === 1,
      ),
    [bookings, provider],
  );

  if (isLoading) return <p className="text-slate-400">Cargando reservas…</p>;

  if (pendientes.length === 0) {
    return (
      <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
        No tenés reservas pendientes de confirmar.
      </p>
    );
  }

  function confirmar(b: Booking) {
    run({ ...escrow, functionName: "confirmService", args: [BigInt(b.id)] }, refetch);
  }

  function reembolsar(b: Booking) {
    run({ ...escrow, functionName: "cancelAndRefund", args: [BigInt(b.id)] }, refetch);
  }

  const nowSec = Math.floor(Date.now() / 1000);

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pendientes.map((b) => {
        const dentroDePlazo = Number(b.refundDeadline) >= nowSec;
        const directa = b.agent === zeroAddress;
        return (
          <div
            key={b.id}
            className="glass card-hover flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <p className="font-semibold">
                Reserva #{b.id} · Paquete #{Number(b.packageId)} · {Number(b.quantity)} u.
              </p>
              <p className="text-slate-500">
                Cliente {shortAddress(b.customer)} ·{" "}
                {directa ? "venta directa" : `agente ${shortAddress(b.agent)}`} · vence{" "}
                {formatDate(b.refundDeadline)}
              </p>
              <p className="font-medium text-brand">{formatUSDC(b.amount)} USDC en escrow</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => reembolsar(b)}
                disabled={pending || !dentroDePlazo}
                title={dentroDePlazo ? "" : "Fuera del plazo de reembolso"}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Reembolsar
              </button>
              <button
                onClick={() => confirmar(b)}
                disabled={pending}
                className="btn-primary"
              >
                Confirmar servicio
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
