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
      <p className="text-center text-sm text-slate-400">Conectá tu wallet para comprar</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={busy || soldOut || !pkg.active}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {soldOut
          ? "Agotado"
          : !pkg.active
            ? "No disponible"
            : status === "approving"
              ? "Aprobando USDC…"
              : status === "purchasing"
                ? "Confirmando compra…"
                : status === "done"
                  ? "¡Comprado! ✓"
                  : "Comprar"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function parseError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // Mensajes de require() del contrato vienen como "...reason: Escrow: ..."
  const match = msg.match(/(Escrow|TourPackageNFT|Market): [^"\n]+/);
  if (match) return match[0];
  if (msg.includes("User rejected")) return "Cancelaste la transacción.";
  return "No se pudo completar la operación.";
}
