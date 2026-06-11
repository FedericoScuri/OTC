import { defineChain } from "viem";

/**
 * Red local de Hardhat para la demo (RNF-P02 se valida en una L2 EVM en prod).
 * chainId 31337 es el default de `npm run node` en la raiz del repo.
 */
export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});
