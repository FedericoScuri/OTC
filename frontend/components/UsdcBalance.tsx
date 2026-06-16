"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useContracts } from "@/lib/contracts";
import { formatUSDC } from "@/lib/format";
import { config } from "@/lib/wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";

/**
 * Muestra el saldo USDC de la wallet y un faucet de demo (MockUSDC.mint).
 * El faucet solo existe en la stablecoin de prueba; en prod no hay tal cosa.
 */
export function UsdcBalance() {
  const { address, isConnected } = useAccount();
  const { usdc } = useContracts();
  const { writeContractAsync } = useWriteContract();
  const [minting, setMinting] = useState(false);

  const balance = useReadContract({
    ...usdc,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected || !address) return null;

  async function faucet() {
    if (!address) return;
    try {
      setMinting(true);
      const hash = await writeContractAsync({
        ...usdc,
        functionName: "mint",
        args: [address, parseUnits("1000", 6)],
      });
      await waitForTransactionReceipt(config, { hash });
      await balance.refetch();
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="glass flex items-center gap-4 rounded-2xl px-5 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-white shadow-md shadow-brand/30">
        <CoinIcon />
      </div>
      <div>
        <p className="text-xs text-slate-500">Tu saldo</p>
        <p className="text-lg font-extrabold text-slate-800">
          {balance.data !== undefined ? formatUSDC(balance.data as bigint) : "—"}{" "}
          <span className="text-sm font-semibold text-slate-400">USDC</span>
        </p>
      </div>
      <button
        onClick={faucet}
        disabled={minting}
        className="btn-ghost ml-2 shine relative overflow-hidden disabled:opacity-50"
        title="Acuña 1000 USDC de prueba (solo demo)"
      >
        {minting ? "Acuñando…" : "+1000 faucet"}
      </button>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.5 2 0 0 1-2.5-1.5" />
      <path d="M12 6.5v11" />
    </svg>
  );
}
