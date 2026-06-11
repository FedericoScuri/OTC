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
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <div>
        <p className="text-xs text-slate-500">Tu saldo</p>
        <p className="text-lg font-semibold">
          {balance.data !== undefined ? formatUSDC(balance.data as bigint) : "—"} USDC
        </p>
      </div>
      <button
        onClick={faucet}
        disabled={minting}
        className="ml-auto rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        title="Acuña 1000 USDC de prueba (solo demo)"
      >
        {minting ? "Acuñando…" : "+1000 USDC (faucet)"}
      </button>
    </div>
  );
}
