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
      <div className="glass animate-fade-in-up flex flex-col items-center gap-5 rounded-3xl p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white shadow-lg shadow-brand/30 animate-float">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">Conectá tu wallet para continuar</p>
          <p className="mt-1 text-sm text-slate-500">Necesitás MetaMask en la red Hardhat local.</p>
        </div>
        <WalletButton />
      </div>
    );
  }

  return <>{children(address)}</>;
}
