"use client";

import { useMemo } from "react";
import { useBookings, BOOKING_STATUS } from "@/lib/contracts";
import { formatUSDC, formatDate, shortAddress } from "@/lib/format";

const AGENT_BPS = 1200n;
const TOTAL_BPS = 10000n;

/** Comisión del agente (12%) sobre el monto de una reserva. */
function commission(amount: bigint): bigint {
  return (amount * AGENT_BPS) / TOTAL_BPS;
}

/**
 * Dashboard de comisiones del agente: total cobrado (reservas liberadas) y
 * pendiente (reservas en escrow que todavía no confirmó el proveedor).
 */
export function AgentDashboard({ agent }: { agent: `0x${string}` }) {
  const { bookings, isLoading } = useBookings();

  const mias = useMemo(
    () => bookings.filter((b) => b.agent.toLowerCase() === agent.toLowerCase()),
    [bookings, agent],
  );

  const cobrado = useMemo(
    () => mias.filter((b) => b.status === 2).reduce((acc, b) => acc + commission(b.amount), 0n),
    [mias],
  );
  const pendiente = useMemo(
    () => mias.filter((b) => b.status === 1).reduce((acc, b) => acc + commission(b.amount), 0n),
    [mias],
  );

  if (isLoading) return <p className="text-slate-400">Cargando comisiones…</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ventas atribuidas" value={`${mias.length}`} />
        <Stat label="Comisión cobrada" value={`${formatUSDC(cobrado)} USDC`} accent />
        <Stat label="Comisión pendiente" value={`${formatUSDC(pendiente)} USDC`} />
      </div>

      {mias.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
          Todavía no registrás ventas. Compartí tu link de afiliado para empezar.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Reserva</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2">Tu 12%</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Vence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {mias.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-medium">#{b.id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{shortAddress(b.customer)}</td>
                  <td className="px-4 py-2">{formatUSDC(b.amount)} USDC</td>
                  <td className="px-4 py-2 font-semibold text-brand">
                    {formatUSDC(commission(b.amount))} USDC
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(b.refundDeadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-brand" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const style =
    status === 2
      ? "bg-emerald-100 text-emerald-700"
      : status === 1
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      {BOOKING_STATUS[status] ?? "—"}
    </span>
  );
}
