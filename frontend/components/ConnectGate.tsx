"use client";

import { useAccount } from "wagmi";
import type { ReactNode } from "react";
import { WalletButton } from "./WalletButton";

/**
 * Muestra el contenido solo si hay wallet conectada; si no, invita a conectar.
 * Pasa la dirección conectada al children como render-prop.
 */
export function ConnectGate({ children }: { children: (address: `0x${string}`) => ReactNode }) {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium text-slate-700">Conectá tu wallet para continuar.</p>
        <WalletButton />
      </div>
    );
  }

  return <>{children(address)}</>;
}
