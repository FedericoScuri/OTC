const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const USDC = (n) => ethers.parseUnits(n.toString(), 6);
const Category = { Hotel: 0, Bodega: 1, Aventura: 2, Cultural: 3 };

/**
 * Despliega el sistema OTC completo en orden y guarda las direcciones en
 * deployments/<red>.json para que el frontend las consuma.
 *
 * Orden: MockUSDC -> TourPackageNFT -> CommissionEscrow -> SecondaryMarket
 * y luego se autoriza al escrow como único minteador del NFT.
 *
 * En la red local también siembra paquetes de demo y reparte USDC de prueba.
 */
async function main() {
  const [deployer, provider, agent, customer] = await ethers.getSigners();
  console.log(`\nRed: ${network.name}`);
  console.log(`Desplegando con la cuenta: ${deployer.address}\n`);

  // La plataforma OTC cobra su 3% acá. En local usamos al desplegador.
  const platformWallet = deployer.address;

  // 1. Stablecoin de prueba (en producción se reemplaza por el USDC real).
  const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
  await usdc.waitForDeployment();
  console.log(`MockUSDC ............ ${await usdc.getAddress()}`);

  // 2. NFT de paquetes turísticos (ERC-1155).
  const nft = await (
    await ethers.getContractFactory("TourPackageNFT")
  ).deploy("https://otc.example/api/metadata/{id}.json");
  await nft.waitForDeployment();
  console.log(`TourPackageNFT ...... ${await nft.getAddress()}`);

  // 3. Escrow + motor de comisiones 85/12/3.
  const escrow = await (
    await ethers.getContractFactory("CommissionEscrow")
  ).deploy(await usdc.getAddress(), await nft.getAddress(), platformWallet);
  await escrow.waitForDeployment();
  console.log(`CommissionEscrow .... ${await escrow.getAddress()}`);

  // 4. Mercado secundario con royalty forzoso.
  const market = await (
    await ethers.getContractFactory("SecondaryMarket")
  ).deploy(await usdc.getAddress(), await nft.getAddress(), platformWallet);
  await market.waitForDeployment();
  console.log(`SecondaryMarket ..... ${await market.getAddress()}`);

  // 5. Autorizamos al escrow como único minteador de reservas.
  await (await nft.setEscrow(await escrow.getAddress())).wait();
  console.log(`\n✓ Escrow autorizado como minteador en el NFT`);

  // --- Datos de demo (solo en redes locales) ---
  if (network.name === "localhost" || network.name === "hardhat") {
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 3600;

    const demo = [
      [Category.Bodega, "Cata premium en Bodega Mendoza", USDC(120), 20],
      [Category.Hotel, "2 noches Hotel Cordillera", USDC(250), 15],
      [Category.Aventura, "Rafting + trekking Potrerillos", USDC(80), 30],
    ];
    for (const [cat, name, price, supply] of demo) {
      const checkIn = now + 30 * day;
      await (
        await nft
          .connect(provider)
          .createPackage(cat, name, price, checkIn, checkIn + 2 * day, checkIn - 7 * day, supply)
      ).wait();
    }
    console.log(`✓ ${demo.length} paquetes de demo creados por el proveedor`);

    // Repartimos USDC de prueba para poder comprar en la demo.
    await (await usdc.mint(customer.address, USDC(10_000))).wait();
    console.log(`✓ 10.000 USDC de prueba acuñados al cliente de demo`);

    console.log(`\nCuentas de demo:`);
    console.log(`  Proveedor : ${provider.address}`);
    console.log(`  Agente    : ${agent.address}`);
    console.log(`  Cliente   : ${customer.address}`);
  }

  // Guardamos las direcciones para el frontend/backend.
  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contracts: {
      MockUSDC: await usdc.getAddress(),
      TourPackageNFT: await nft.getAddress(),
      CommissionEscrow: await escrow.getAddress(),
      SecondaryMarket: await market.getAddress(),
    },
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(out, null, 2));
  console.log(`\n✓ Direcciones guardadas en deployments/${network.name}.json`);

  // También las dejamos donde el frontend las lee en runtime.
  const frontendPublic = path.join(__dirname, "..", "frontend", "public");
  if (fs.existsSync(frontendPublic)) {
    fs.writeFileSync(path.join(frontendPublic, "deployments.json"), JSON.stringify(out, null, 2));
    console.log(`✓ Direcciones copiadas a frontend/public/deployments.json`);
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
