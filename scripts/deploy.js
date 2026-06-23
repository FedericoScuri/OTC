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

    // Las 3 primeras se mantienen (IDs 1-3) porque las reservas pre-cargadas
    // apuntan a los paquetes #1 y #3. Después, variedad + 5 actividades
    // GRATUITAS (precio 0) para mostrar el flujo sin costo en la demo.
    const demo = [
      [Category.Bodega, "Cata premium en Bodega Mendoza", USDC(120), 20],
      [Category.Hotel, "2 noches Hotel Cordillera", USDC(250), 15],
      [Category.Aventura, "Rafting + trekking Potrerillos", USDC(80), 30],
      // --- Gratuitas (precio 0): ideales para mostrar el flujo sin costo ---
      [Category.Cultural, "Caminata guiada GRATIS por el centro histórico", USDC(0), 50],
      [Category.Bodega, "Degustación introductoria GRATIS en bodega boutique", USDC(0), 40],
      [Category.Cultural, "Clase de tango GRATIS en Plaza Independencia", USDC(0), 60],
      [Category.Aventura, "Senderismo GRATIS al Cerro de la Gloria", USDC(0), 45],
      [Category.Hotel, "Welcome drink GRATIS + late checkout", USDC(0), 35],
      // --- Más actividades (pagas) ---
      [Category.Cultural, "City tour + Museo del Vino", USDC(15), 35],
      [Category.Bodega, "Almuerzo maridaje en Valle de Uco", USDC(95), 18],
      [Category.Aventura, "Cabalgata al atardecer en los Andes", USDC(60), 25],
      [Category.Hotel, "Noche en cabaña de montaña", USDC(140), 12],
      [Category.Aventura, "Parapente en Cuchilla del Tigre", USDC(110), 10],
      [Category.Bodega, "Tour en bici entre viñedos + picada", USDC(45), 22],
      [Category.Cultural, "Show de folklore + cena regional", USDC(35), 28],
      [Category.Aventura, "Travesía 4x4 a la Alta Montaña", USDC(130), 14],
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

    // Repartimos USDC de prueba GRATIS de sobra: la wallet del cliente (admin1)
    // puede crear todas las reservas que quiera para testing sin costo real.
    await (await usdc.mint(customer.address, USDC(10_000))).wait();
    console.log(`✓ 10.000 USDC de prueba (gratis) acuñados al cliente de demo`);

    // Pre-cargamos 2 reservas REALES on-chain en la wallet del cliente (admin1),
    // para que su perfil "Mis reservas" ya tenga datos en la presentación.
    // El cliente aprueba el escrow una vez y compra dos paquetes.
    await (await usdc.connect(customer).approve(await escrow.getAddress(), USDC(10_000))).wait();
    // Reserva 1: Cata en Bodega (paquete #1), comprada a través del AGENTE (comisión 12%).
    await (await escrow.connect(customer).purchase(1n, 1n, agent.address)).wait();
    // Reserva 2: Rafting (paquete #3), venta DIRECTA (sin agente).
    await (await escrow.connect(customer).purchase(3n, 1n, ethers.ZeroAddress)).wait();
    console.log(`✓ 2 reservas pre-cargadas en la wallet del cliente (1 vía agente, 1 directa)`);

    console.log(`\nCuentas de demo:`);
    console.log(`  Proveedor : ${provider.address}`);
    console.log(`  Agente    : ${agent.address}`);
    console.log(`  Cliente (admin1) : ${customer.address}`);
  }

  // --- Seed mínimo en testnet pública (ej. Base Sepolia) ---
  // En testnet sólo existe la cuenta del deployer (no hay signers extra), así que
  // el propio deployer publica unos pocos paquetes para que el catálogo no quede
  // vacío en la defensa. Sin reservas pre-cargadas ni reparto de USDC.
  if (network.name === "baseSepolia") {
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 3600;
    const seed = [
      [Category.Bodega, "Cata premium en Bodega Mendoza", USDC(120), 20],
      [Category.Hotel, "2 noches Hotel Cordillera", USDC(250), 15],
      [Category.Aventura, "Rafting + trekking Potrerillos", USDC(80), 30],
    ];
    for (const [cat, name, price, supply] of seed) {
      const checkIn = now + 30 * day;
      await (
        await nft.createPackage(cat, name, price, checkIn, checkIn + 2 * day, checkIn - 7 * day, supply)
      ).wait();
    }
    console.log(`✓ ${seed.length} paquetes sembrados en testnet por el deployer`);
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

  if (network.name === "baseSepolia") {
    const base = "https://sepolia.basescan.org/address/";
    console.log(`\nVer en el explorer (públicos y auditables):`);
    for (const [name, addr] of Object.entries(out.contracts)) {
      console.log(`  ${name.padEnd(18)} ${base}${addr}`);
    }
    console.log(`\nVerificá el código fuente con: npm run verify:testnet`);
  }

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
