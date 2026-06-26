"use client";

import { useEffect, useMemo, useState } from "react";
import { zeroAddress } from "viem";
import {
  useContracts,
  useBookings,
  usePackages,
  BOOKING_STATUS,
  type Booking,
} from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { useAuth } from "@/lib/auth";
import { backend } from "@/lib/backend";
import { formatPrice, formatDate, shortAddress, categoryLabel } from "@/lib/format";

/**
 * Banner que aclara de qué cuentas se están mostrando las reservas. Las reservas
 * viven on-chain: las hechas con MetaMask quedan atadas a la wallet conectada;
 * las hechas "sin wallet" (gasless, RF-A01) quedan en la Smart Account que el
 * backend deriva del email. Acá mostramos ambas.
 */
function SourceBanner({
  wallet,
  smartAccount,
  count,
}: {
  wallet?: `0x${string}`;
  smartAccount?: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-2.5 text-sm text-brand-dark">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      Mostrando tus reservas
      {wallet && (
        <>
          {" "}· wallet{" "}
          <span className="font-mono font-semibold">{shortAddress(wallet)}</span>
        </>
      )}
      {smartAccount && (
        <>
          {" "}· sin wallet{" "}
          <span className="font-mono font-semibold">{shortAddress(smartAccount)}</span>
        </>
      )}
      <span className="text-brand-dark/60">
        · {count} {count === 1 ? "reserva" : "reservas"}
      </span>
    </div>
  );
}

/**
 * "Mis reservas" — las reservas (on-chain) del usuario logueado. Lee todas las
 * bookings del escrow y muestra las que pertenecen a:
 *   - la wallet conectada (compras con MetaMask), y
 *   - la Smart Account derivada del email (compras gasless "sin wallet").
 * Muestra estado (pendiente / liberada / reembolsada) y permite cancelar las
 * propias de la wallet que sigan dentro del plazo de reembolso.
 */
export function MyReservations({ owner }: { owner?: `0x${string}` }) {
  const { user } = useAuth();
  const { escrow } = useContracts();
  const { bookings, isLoading, refetch } = useBookings();
  const { packages } = usePackages();
  const { run, pending, error } = useTx();
  const [smartAccount, setSmartAccount] = useState<string>();

  // La reserva "sin wallet" (gasless) queda a nombre de la Smart Account que el
  // backend deriva del email. La resolvemos para incluir esas reservas también.
  useEffect(() => {
    let cancelled = false;
    if (!user?.email) {
      setSmartAccount(undefined);
      return;
    }
    backend
      .post<{ smartAccount: string }>("/api/aa/account", { email: user.email })
      .then((r) => {
        if (!cancelled) setSmartAccount(r.smartAccount);
      })
      .catch(() => {
        if (!cancelled) setSmartAccount(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const owned = useMemo(() => {
    const set = new Set<string>();
    if (owner) set.add(owner.toLowerCase());
    if (smartAccount) set.add(smartAccount.toLowerCase());
    return set;
  }, [owner, smartAccount]);

  const mias = useMemo(
    () =>
      bookings
        .filter((b) => owned.has(b.customer.toLowerCase()))
        .sort((a, b) => b.id - a.id),
    [bookings, owned],
  );

  if (isLoading) return <p className="text-slate-400">Cargando tus reservas…</p>;

  if (mias.length === 0) {
    return (
      <div className="space-y-3">
        <SourceBanner wallet={owner} smartAccount={smartAccount} count={0} />
        <div className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-700">Todavía no tenés reservas.</p>
          <p className="mt-1">
            Reservá un paquete en el{" "}
            <a href="/catalogo" className="font-semibold text-brand hover:text-brand-dark">
              catálogo
            </a>
            . Las compras <strong>“sin wallet”</strong> aparecen acá automáticamente; las hechas con{" "}
            <strong>MetaMask</strong> aparecen cuando conectás esa misma wallet (para la demo, la{" "}
            <strong>cuenta Cliente</strong> que termina en <span className="font-mono">…b906</span>).
          </p>
        </div>
      </div>
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
      <SourceBanner wallet={owner} smartAccount={smartAccount} count={mias.length} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mias.map((b) => {
        const pkg = packages.find((p) => p.id === Number(b.packageId));
        const estado = BOOKING_STATUS[b.status] ?? "—";
        const directa = b.agent === zeroAddress;
        const dentroDePlazo = Number(b.refundDeadline) >= nowSec;
        const viaWallet = !!owner && b.customer.toLowerCase() === owner.toLowerCase();
        const sinWallet =
          !!smartAccount && b.customer.toLowerCase() === smartAccount.toLowerCase();
        return (
          <div
            key={b.id}
            className="glass card-hover flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {pkg && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                    {categoryLabel(pkg.category)}
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[estado] ?? ""}`}>
                  {estado}
                </span>
                {sinWallet && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark">
                    sin wallet
                  </span>
                )}
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
              <p className="font-medium text-brand">{formatPrice(b.amount)}</p>
            </div>

            {b.status === 1 && viaWallet && (
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
            {b.status === 1 && sinWallet && (
              <p
                className="shrink-0 self-center text-xs text-slate-400"
                title="Reserva hecha sin wallet: la gestiona la cuenta del email, no MetaMask"
              >
                Reserva sin wallet
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
