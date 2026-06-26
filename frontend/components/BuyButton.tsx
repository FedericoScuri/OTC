"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { zeroAddress, type Address } from "viem";
import { config } from "@/lib/wagmi";
import { useContracts, type Package } from "@/lib/contracts";

type Status = "idle" | "approving" | "purchasing" | "done" | "error";

/**
 * Flujo de compra completo (RF-C01 desde la UI):
 *   1. Si el escrow no tiene allowance suficiente -> approve(USDC).
 *   2. purchase(packageId, cantidad, agente) -> retiene el pago y mintea el NFT.
 * `agent` viene del link de afiliado (?ref=) si lo hay (RF-D02).
 */
export function BuyButton({
  pkg,
  quantity,
  agent,
  onDone,
}: {
  pkg: Package;
  quantity: number;
  agent?: Address;
  onDone?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { usdc, escrow } = useContracts();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();

  const available = Number(pkg.maxSupply - pkg.minted);
  const soldOut = available <= 0;
  const free = pkg.price === 0n;
  const busy = status === "approving" || status === "purchasing";

  async function handleBuy() {
    if (!address) return;
    setError(undefined);
    const total = pkg.price * BigInt(quantity);
    const agentArg = agent ?? zeroAddress;

    try {
      // 1. Allowance: ¿el escrow ya puede gastar nuestro USDC?
      const allowance = (await readContract(config, {
        ...usdc,
        functionName: "allowance",
        args: [address, escrow.address],
      })) as bigint;

      if (allowance < total) {
        setStatus("approving");
        const approveHash = await writeContractAsync({
          ...usdc,
          functionName: "approve",
          args: [escrow.address, total],
        });
        await waitForTransactionReceipt(config, { hash: approveHash });
      }

      // 2. Compra: retiene pago + mintea reserva.
      setStatus("purchasing");
      const buyHash = await writeContractAsync({
        ...escrow,
        functionName: "purchase",
        args: [BigInt(pkg.id), BigInt(quantity), agentArg],
      });
      await waitForTransactionReceipt(config, { hash: buyHash });

      setStatus("done");
      onDone?.();
    } catch (e) {
      setStatus("error");
      setError(parseError(e));
    }
  }

  if (!isConnected) {
    return (
      <p className="rounded-lg bg-slate-50 py-2 text-center text-xs text-slate-400">
        Conectá tu wallet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={busy || soldOut || !pkg.active}
        className="btn-primary shine w-full"
      >
        {busy && <Spinner />}
        {soldOut
          ? "Agotado"
          : !pkg.active
            ? "No disponible"
            : status === "approving"
              ? "Aprobando…"
              : status === "purchasing"
                ? "Reservando…"
                : status === "done"
                  ? "¡Reservado! ✓"
                  : free
                    ? "Reservar gratis"
                    : "Reservar"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

function parseError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // Mensajes de require() del contrato vienen como "...reason: Escrow: ..."
  const match = msg.match(/(Escrow|TourPackageNFT|Market): [^"\n]+/);
  if (match) return match[0];
  if (msg.includes("User rejected")) return "Cancelaste la transacción.";
  // Tras reiniciar el nodo local, MetaMask queda con un nonce viejo y la red lo rechaza.
  if (/nonce/i.test(msg)) {
    return "MetaMask quedó desincronizada con la red. En MetaMask: Configuración → Avanzado → “Borrar datos de actividad y nonce”, y reintentá.";
  }
  return "No se pudo completar la operación.";
}
