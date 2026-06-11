const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const USDC = (n) => ethers.parseUnits(n.toString(), 6); // helper: USDC tiene 6 decimales

// Categoría del enum TourPackageNFT.Category
const Category = { Hotel: 0, Bodega: 1, Aventura: 2, Cultural: 3 };
// Estados del enum CommissionEscrow.Status
const Status = { None: 0, Pending: 1, Released: 2, Refunded: 3 };

describe("OTC - Open Tourism Commerce", function () {
  // Despliega todo el sistema y reparte USDC a los actores.
  async function deployFixture() {
    const [deployer, provider, agent, customer, buyer, platform] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const TourPackageNFT = await ethers.getContractFactory("TourPackageNFT");
    const nft = await TourPackageNFT.deploy("https://otc.example/api/metadata/{id}.json");

    const CommissionEscrow = await ethers.getContractFactory("CommissionEscrow");
    const escrow = await CommissionEscrow.deploy(
      await usdc.getAddress(),
      await nft.getAddress(),
      platform.address
    );

    const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
    const market = await SecondaryMarket.deploy(
      await usdc.getAddress(),
      await nft.getAddress(),
      platform.address
    );

    // El NFT solo deja mintear al escrow.
    await nft.setEscrow(await escrow.getAddress());

    // Repartimos USDC de prueba a los compradores.
    await usdc.mint(customer.address, USDC(10_000));
    await usdc.mint(buyer.address, USDC(10_000));

    return { usdc, nft, escrow, market, deployer, provider, agent, customer, buyer, platform };
  }

  // Crea un paquete estándar del proveedor y devuelve su packageId.
  async function createPackage(nft, provider, overrides = {}) {
    const now = await time.latest();
    const checkIn = overrides.checkIn ?? now + 30 * 24 * 3600; // en 30 días
    const checkOut = overrides.checkOut ?? checkIn + 2 * 24 * 3600;
    const refundDeadline = overrides.refundDeadline ?? checkIn - 7 * 24 * 3600; // hasta 7 días antes
    const price = overrides.price ?? USDC(100);
    const supply = overrides.supply ?? 10;
    const category = overrides.category ?? Category.Hotel;

    await nft
      .connect(provider)
      .createPackage(category, "Noche en Bodega Mendoza", price, checkIn, checkOut, refundDeadline, supply);
    return await nft.totalPackages(); // el último ID creado
  }

  describe("Setup y despliegue", function () {
    it("configura el escrow autorizado en el NFT", async function () {
      const { nft, escrow } = await loadFixture(deployFixture);
      expect(await nft.escrow()).to.equal(await escrow.getAddress());
    });

    it("el USDC mock usa 6 decimales como el real", async function () {
      const { usdc } = await loadFixture(deployFixture);
      expect(await usdc.decimals()).to.equal(6);
    });

    it("el split del escrow suma 100% (8500 + 1200 + 300)", async function () {
      const { escrow } = await loadFixture(deployFixture);
      const total =
        (await escrow.PROVIDER_BPS()) + (await escrow.AGENT_BPS()) + (await escrow.PLATFORM_BPS());
      expect(total).to.equal(await escrow.TOTAL_BPS());
    });
  });

  describe("TourPackageNFT (RF-B02)", function () {
    it("un proveedor publica un paquete con fechas y política", async function () {
      const { nft, provider } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      const p = await nft.getPackage(id);
      expect(p.provider).to.equal(provider.address);
      expect(p.price).to.equal(USDC(100));
      expect(p.maxSupply).to.equal(10n);
      expect(p.active).to.equal(true);
    });

    it("rechaza fechas inválidas (checkout antes que checkin)", async function () {
      const { nft, provider } = await loadFixture(deployFixture);
      const now = await time.latest();
      await expect(
        nft
          .connect(provider)
          .createPackage(Category.Hotel, "X", USDC(100), now + 1000, now + 500, now, 5)
      ).to.be.revertedWith("TourPackageNFT: fechas invalidas");
    });

    it("nadie que no sea el escrow puede mintear reservas", async function () {
      const { nft, provider, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await expect(
        nft.connect(customer).mintReservation(customer.address, id, 1)
      ).to.be.revertedWith("TourPackageNFT: solo el escrow puede mintear");
    });

    it("solo el proveedor dueño puede pausar su paquete", async function () {
      const { nft, provider, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await expect(nft.connect(customer).setPackageActive(id, false)).to.be.revertedWith(
        "TourPackageNFT: no sos el proveedor"
      );
    });
  });

  describe("CommissionEscrow - compra y split 85/12/3 (RF-C01)", function () {
    it("compra: retiene el pago en escrow y acuña el NFT al cliente", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);

      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);

      // Los fondos quedan en el escrow.
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(USDC(100));
      // El cliente tiene su reserva tokenizada.
      expect(await nft.balanceOf(customer.address, id)).to.equal(1n);

      const b = await escrow.getBooking(1);
      expect(b.status).to.equal(Status.Pending);
      expect(b.amount).to.equal(USDC(100));
    });

    it("CON agente: divide exactamente 85% / 12% / 3%", async function () {
      const { usdc, nft, escrow, provider, agent, customer, platform } =
        await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);

      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);

      const provBefore = await usdc.balanceOf(provider.address);
      const agentBefore = await usdc.balanceOf(agent.address);
      const platBefore = await usdc.balanceOf(platform.address);

      await escrow.connect(provider).confirmService(1);

      expect((await usdc.balanceOf(provider.address)) - provBefore).to.equal(USDC(85));
      expect((await usdc.balanceOf(agent.address)) - agentBefore).to.equal(USDC(12));
      expect((await usdc.balanceOf(platform.address)) - platBefore).to.equal(USDC(3));
      // El escrow queda en cero.
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
    });

    it("SIN agente (venta directa): proveedor 97% / plataforma 3%", async function () {
      const { usdc, nft, escrow, provider, customer, platform } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);

      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, ethers.ZeroAddress);

      const provBefore = await usdc.balanceOf(provider.address);
      const platBefore = await usdc.balanceOf(platform.address);

      await escrow.connect(provider).confirmService(1);

      expect((await usdc.balanceOf(provider.address)) - provBefore).to.equal(USDC(97));
      expect((await usdc.balanceOf(platform.address)) - platBefore).to.equal(USDC(3));
    });

    it("solo el proveedor puede confirmar el servicio", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);

      await expect(escrow.connect(customer).confirmService(1)).to.be.revertedWith(
        "Escrow: solo el proveedor confirma"
      );
    });

    it("no se puede confirmar dos veces la misma reserva", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);
      await escrow.connect(provider).confirmService(1);

      await expect(escrow.connect(provider).confirmService(1)).to.be.revertedWith(
        "Escrow: reserva no pendiente"
      );
    });

    it("el agente no puede ser el mismo cliente", async function () {
      const { usdc, nft, escrow, provider, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await expect(
        escrow.connect(customer).purchase(id, 1, customer.address)
      ).to.be.revertedWith("Escrow: el agente no puede ser el cliente");
    });

    it("respeta el cupo: no se puede vender más que el supply", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider, { supply: 2, price: USDC(50) });
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(1000));
      await expect(
        escrow.connect(customer).purchase(id, 3, agent.address)
      ).to.be.revertedWith("TourPackageNFT: sin cupo disponible");
    });
  });

  describe("CommissionEscrow - cancelación y reembolso", function () {
    it("reembolsa al cliente dentro del plazo", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);

      const before = await usdc.balanceOf(customer.address);
      await escrow.connect(customer).cancelAndRefund(1);

      expect((await usdc.balanceOf(customer.address)) - before).to.equal(USDC(100));
      expect((await escrow.getBooking(1)).status).to.equal(Status.Refunded);
    });

    it("NO reembolsa pasado el deadline de la política", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);

      // Avanzamos el tiempo más allá del refundDeadline.
      const b = await escrow.getBooking(1);
      await time.increaseTo(b.refundDeadline + 1n);

      await expect(escrow.connect(customer).cancelAndRefund(1)).to.be.revertedWith(
        "Escrow: fuera del plazo de reembolso"
      );
    });

    it("no se puede confirmar una reserva ya reembolsada", async function () {
      const { usdc, nft, escrow, provider, agent, customer } = await loadFixture(deployFixture);
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);
      await escrow.connect(customer).cancelAndRefund(1);

      await expect(escrow.connect(provider).confirmService(1)).to.be.revertedWith(
        "Escrow: reserva no pendiente"
      );
    });
  });

  describe("SecondaryMarket - reventa con royalty forzoso (RF-C02)", function () {
    // Helper: el cliente compra una reserva y confirma el servicio (ya es dueño del NFT).
    async function buyAndOwn(fix) {
      const { usdc, nft, escrow, provider, agent, customer } = fix;
      const id = await createPackage(nft, provider);
      await usdc.connect(customer).approve(await escrow.getAddress(), USDC(100));
      await escrow.connect(customer).purchase(id, 1, agent.address);
      return id;
    }

    it("revende aplicando royalty 5% al proveedor y fee 2% a la plataforma", async function () {
      const fix = await loadFixture(deployFixture);
      const { usdc, nft, market, provider, customer, buyer, platform } = fix;
      const id = await buyAndOwn(fix);

      // El vendedor (customer) aprueba el mercado para mover su NFT.
      await nft.connect(customer).setApprovalForAll(await market.getAddress(), true);
      await market.connect(customer).list(id, 1, USDC(200)); // lo revende a 200

      // El comprador aprueba USDC y compra.
      await usdc.connect(buyer).approve(await market.getAddress(), USDC(200));

      const provBefore = await usdc.balanceOf(provider.address);
      const sellerBefore = await usdc.balanceOf(customer.address);
      const platBefore = await usdc.balanceOf(platform.address);

      await market.connect(buyer).buy(1, 1);

      // 200 USDC: royalty 5% = 10, fee 2% = 4, vendedor = 186.
      expect((await usdc.balanceOf(provider.address)) - provBefore).to.equal(USDC(10));
      expect((await usdc.balanceOf(platform.address)) - platBefore).to.equal(USDC(4));
      expect((await usdc.balanceOf(customer.address)) - sellerBefore).to.equal(USDC(186));

      // El NFT pasó al comprador.
      expect(await nft.balanceOf(buyer.address, id)).to.equal(1n);
      expect(await nft.balanceOf(customer.address, id)).to.equal(0n);
    });

    it("falla si el vendedor no aprobó el mercado", async function () {
      const fix = await loadFixture(deployFixture);
      const { market, customer } = fix;
      const id = await buyAndOwn(fix);
      await expect(market.connect(customer).list(id, 1, USDC(200))).to.be.revertedWith(
        "Market: falta aprobar el mercado"
      );
    });

    it("el vendedor puede cancelar su publicación", async function () {
      const fix = await loadFixture(deployFixture);
      const { nft, market, customer } = fix;
      const id = await buyAndOwn(fix);
      await nft.connect(customer).setApprovalForAll(await market.getAddress(), true);
      await market.connect(customer).list(id, 1, USDC(200));
      await market.connect(customer).cancelListing(1);
      expect((await market.getListing(1)).active).to.equal(false);
    });

    it("no se puede comprar una publicación cancelada", async function () {
      const fix = await loadFixture(deployFixture);
      const { usdc, nft, market, customer, buyer } = fix;
      const id = await buyAndOwn(fix);
      await nft.connect(customer).setApprovalForAll(await market.getAddress(), true);
      await market.connect(customer).list(id, 1, USDC(200));
      await market.connect(customer).cancelListing(1);
      await usdc.connect(buyer).approve(await market.getAddress(), USDC(200));
      await expect(market.connect(buyer).buy(1, 1)).to.be.revertedWith(
        "Market: publicacion inactiva"
      );
    });
  });
});
