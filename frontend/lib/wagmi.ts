import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhatLocal } from "./chains";

/**
 * Config de wagmi: una sola cadena (Hardhat local) y el conector `injected`
 * que cubre MetaMask (RF-A01). WalletConnect se puede sumar luego con un
 * projectId, pero para la demo local MetaMask alcanza y no pide API key.
 */
export const config = createConfig({
  chains: [hardhatLocal],
  connectors: [injected()],
  transports: {
    [hardhatLocal.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
