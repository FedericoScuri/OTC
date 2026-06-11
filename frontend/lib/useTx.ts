"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "./wagmi";
import { parseError } from "./errors";

/**
 * Helper para mandar una transacción de escritura y esperar el recibo,
 * manejando estado de pending/error. Reusado por los paneles de proveedor y agente.
 */
export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function run(
    params: Parameters<typeof writeContractAsync>[0],
    onDone?: () => void,
  ): Promise<boolean> {
    setError(undefined);
    setPending(true);
    try {
      const hash = await writeContractAsync(params);
      await waitForTransactionReceipt(config, { hash });
      onDone?.();
      return true;
    } catch (e) {
      setError(parseError(e));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error };
}
