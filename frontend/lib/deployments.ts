"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";

export type Deployment = {
  network: string;
  chainId: number;
  contracts: {
    MockUSDC: Address;
    TourPackageNFT: Address;
    CommissionEscrow: Address;
    SecondaryMarket: Address;
  };
};

/**
 * Direcciones por defecto = las deterministas de un nodo Hardhat recien
 * levantado (cuenta #0 como desplegador, nonces 0..3 en el orden del deploy).
 * `scripts/deploy.js` sobrescribe `public/deployments.json` con las reales en
 * cada deploy; el frontend lo lee en runtime y, si no esta, usa estas.
 */
export const DEFAULT_DEPLOYMENT: Deployment = {
  network: "localhost",
  chainId: 31337,
  contracts: {
    MockUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    TourPackageNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    CommissionEscrow: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SecondaryMarket: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  },
};

/**
 * Hook que devuelve las direcciones de contratos. Intenta leer el JSON real
 * generado por el deploy; si falla (no se deployo aun), cae a las default.
 */
export function useDeployment(): Deployment {
  const [deployment, setDeployment] = useState<Deployment>(DEFAULT_DEPLOYMENT);

  useEffect(() => {
    let cancelled = false;
    fetch("/deployments.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json && json.contracts) setDeployment(json as Deployment);
      })
      .catch(() => {
        /* sin deploy todavia: usamos DEFAULT_DEPLOYMENT */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return deployment;
}
