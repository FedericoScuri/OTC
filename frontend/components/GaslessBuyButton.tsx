"use client";

import { useState } from "react";
import type { Address } from "viem";
import type { Package } from "@/lib/contracts";
import { backend, type GaslessPurchase } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { CheckIcon } from "./icons";

/**
 * RF-A01 / PDR §2.1 — Compra gasless con Account Abstraction.
 *
 * Un usuario logueado con email reserva SIN wallet ni cripto: el backend deriva
 * su Smart Account (mock MPC), el Paymaster patrocina el gas y el USDC llega por
 * on-ramp. Acá solo mandamos el email + paquete; el backend hace todo on-chain.
 */
export function GaslessBuyButton({
  pkg,
  quantity,
  agent,
}: {
  pkg: Package;
  quantity: number;
  agent?: Address;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<GaslessPurchase | null>(null);
  const [error, setError] = useState<string>();

  async function handle() {
    if (!user) return;
    setStatus("loading");
    setError(undefined);
    try {
      const res = await backend.post<GaslessPurchase>("/api/aa/purchase", {
        email: user.email,
        packageId: pkg.id,
        quantity,
        agent: agent ?? undefined,
      });
      setResult(res);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "No se pudo completar la compra gasless.");
    }
  }

  if (status === "done" && result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
        <p className="flex items-center gap-1 font-semibold">
          <CheckIcon size={13} /> Reserva #{result.bookingId} creada sin wallet
        </p>
        <p className="mt-0.5 text-emerald-700">
          Gas patrocinado por el Paymaster · pagaste solo con tarjeta (USDC).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handle}
        disabled={status === "loading" || !pkg.active || pkg.maxSupply <= pkg.minted}
        className="btn-accent shine w-full !py-2 text-xs"
        title="Reservá con tu email, sin necesidad de wallet ni cripto"
      >
        {status === "loading"
          ? "Procesando…"
          : pkg.price === 0n
            ? "Reservar gratis (sin wallet)"
            : "💳 Pagar con tarjeta (sin wallet)"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
