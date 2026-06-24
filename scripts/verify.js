const { run, network, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verifica el código fuente de los contratos OTC en el explorer
 * (sepolia.basescan.org) para que queden públicos y auditables → RNF-S01.
 *
 * Lee las direcciones de deployments/<red>.json (generado por deploy.js) y
 * reconstruye los argumentos de constructor de cada contrato.
 *
 * Uso: npm run verify:testnet  (después de npm run deploy:testnet)
 */
const NFT_URI = "https://otc.example/api/metadata/{id}.json";

async function verify(address, constructorArguments) {
  try {
    await run("verify:verify", { address, constructorArguments });
    console.log(`✓ verificado: ${address}`);
  } catch (e) {
    const msg = (e.message || "").toLowerCase();
    if (msg.includes("already verified")) {
      console.log(`• ya estaba verificado: ${address}`);
    } else {
      console.error(`✗ falló ${address}: ${e.message}`);
    }
  }
}

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`No existe ${file}. Corré primero el deploy en ${network.name}.`);
  }
  const { contracts: c } = JSON.parse(fs.readFileSync(file, "utf8"));
  // El platformWallet usado en el deploy es la cuenta del deployer.
  const [deployer] = await ethers.getSigners();
  const platform = deployer.address;

  console.log(`Verificando contratos en ${network.name}...\n`);
  await verify(c.MockUSDC, []);
  await verify(c.TourPackageNFT, [NFT_URI]);
  await verify(c.CommissionEscrow, [c.MockUSDC, c.TourPackageNFT, platform]);
  await verify(c.SecondaryMarket, [c.MockUSDC, c.TourPackageNFT, platform]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
