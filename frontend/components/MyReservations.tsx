"use client";

import { useMemo } from "react";
import { zeroAddress } from "viem";
import {
  useContracts,
  useBookings,
  usePackages,
  BOOKING_STATUS,
  type Booking,
} from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { formatUSDC, formatDate, shortAddress, categoryLabel } from "@/lib/format";

/**
 * "Mis reservas" — las reservas (on-chain) del cliente conectado. Lee todas las
 * bookings del escrow y filtra por customer == wallet conectada. Muestra estado
 * (pendiente / liberada / reembolsada) y permite cancelar las que siguen dentro
 * del plazo de reembolso.
 */
export function MyReservations({ owner }: { owner: `0x${string}` }) {
  const { escrow } = useContracts();
  const { bookings, isLoading, refetch } = useBookings();
  const { packages } = usePackages();
  const { run, pending, error } = useTx();

  const mias = useMemo(
    () =>
      bookings
        .filter((b) => b.customer.toLowerCase() === owner.toLowerCase())
        .sort((a, b) => b.id - a.id),
    [bookings, owner],
  );

  if (isLoading) return <p className="text-slate-400">Cargando tus reservas…</p>;

  if (mias.length === 0) {
    return (
      <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
        Todavía no tenés reservas. Reservá un paquete en el{" "}
        <a href="/catalogo" className="font-semibold text-brand hover:text-brand-dark">
          catálogo
        </a>
        .
      </p>
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const STATUS_STYLE: Record<string, string> = {
    Pendiente: "bg-amber-50 text-amber-700",
    Liberada: "bg-emerald-50 text-emerald-700",
    Reembolsada: "bg-slate-100 text-slate-500",
  };

  function cancelar(b: Booking) {
    run({ ...escrow, functionName: "cancelAndRefund", args: [BigInt(b.id)] }, refetch);
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mias.map((b) => {
        const pkg = packages.find((p) => p.id === Number(b.packageId));
        const estado = BOOKING_STATUS[b.status] ?? "—";
        const directa = b.agent === zeroAddress;
        const dentroDePlazo = Number(b.refundDeadline) >= nowSec;
        return (
          <div
            key={b.id}
            className="glass card-hover flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-sm">
              <div className="flex items-center gap-2">
                {pkg && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                    {categoryLabel(pkg.category)}
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[estado] ?? ""}`}>
                  {estado}
                </span>
              </div>
              <p className="mt-1.5 font-semibold">
                {pkg ? pkg.name : `Paquete #${Number(b.packageId)}`}{" "}
                <span className="font-normal text-slate-400">· reserva #{b.id}</span>
              </p>
              <p className="text-slate-500">
                {Number(b.quantity)} u. ·{" "}
                {pkg ? `viaje ${formatDate(pkg.checkInDate)} · ` : ""}
                {directa ? "venta directa" : `agente ${shortAddress(b.agent)}`}
              </p>
              <p className="font-medium text-brand">{formatUSDC(b.amount)} USDC</p>
            </div>

            {b.status === 1 && (
              <div className="flex shrink-0">
                <button
                  onClick={() => cancelar(b)}
                  disabled={pending || !dentroDePlazo}
                  title={dentroDePlazo ? "" : "Fuera del plazo de reembolso"}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  Cancelar y reembolsar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
