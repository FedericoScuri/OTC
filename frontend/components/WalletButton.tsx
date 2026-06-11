"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhatLocal } from "@/lib/chains";
import { shortAddress } from "@/lib/format";

/**
 * Boton de login Web3 (RF-A01). Conecta MetaMask, muestra la cuenta y avisa
 * si la wallet esta en otra red distinta a la de Hardhat local.
 */
export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {isPending ? "Conectando…" : "Conectar wallet"}
      </button>
    );
  }

  const wrongNetwork = chainId !== hardhatLocal.id;

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork && (
        <button
          onClick={() => switchChain({ chainId: hardhatLocal.id })}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Cambiar a red local
        </button>
      )}
      <span className="rounded-lg bg-white px-3 py-2 text-sm font-mono text-slate-700 ring-1 ring-slate-200">
        {shortAddress(address)}
      </span>
      <button
        onClick={() => disconnect()}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        Salir
      </button>
    </div>
  );
}
