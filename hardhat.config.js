require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Configuración de Hardhat para OTC.
 *
 * Para la demo todo corre en la red local de Hardhat (EVM en memoria).
 * En producción se desplegaría en una L2 EVM-compatible (Base / Polygon)
 * para mantener el gas por debajo de $0.05 por transacción (RNF-P02).
 * El mismo bytecode corre idéntico en cualquiera de esas redes.
 */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Red local en memoria — usada por `npx hardhat test`
    hardhat: {},
    // Nodo local persistente — `npx hardhat node` + deploy con --network localhost
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // --- Testnet pública L2 (se activa con claves en .env) ---
    // Base Sepolia: L2 EVM de bajo costo. Deja los contratos públicos y
    // auditables en el explorer (sepolia.basescan.org) → RNF-S01 / transparencia.
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  // Verificación de código fuente en el explorer (`npm run verify:testnet`).
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
