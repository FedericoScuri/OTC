const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Carga las direcciones de contratos desde deployments/<red>.json (lo genera
 * `npm run deploy:local` en la raíz). Si no existe, usa las deterministas de un
 * nodo Hardhat recién levantado (mismas que el frontend).
 */
function loadAddresses() {
  const file = path.join(__dirname, "..", "..", "deployments", "localhost.json");
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8")).contracts;
    } catch {
      /* json inválido: caemos a los defaults */
    }
  }
  return {
    MockUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    TourPackageNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    CommissionEscrow: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    SecondaryMarket: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  };
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  onrampKey: process.env.ONRAMP_PRIVATE_KEY,
  providerKey: process.env.PROVIDER_PRIVATE_KEY,
  addresses: loadAddresses(),
};
