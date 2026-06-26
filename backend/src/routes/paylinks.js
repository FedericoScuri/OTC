const express = require("express");
const { ethers } = require("ethers");
const chain = require("../chain");
const aa = require("../account-abstraction");
const store = require("../paylinks");

/**
 * Flujo de venta por agente intermedio (link de pago con sobreprecio).
 *
 * Reparto del precio final (sin tocar el contrato):
 *   - base (precio del paquete) → escrow: proveedor 85% / agente 12% / plataforma 3%.
 *   - sobreprecio del agente    → transferencia USDC directa al agente.
 * Por eso el agente cobra (12% del base + sobreprecio) y el precio final que paga
 * el cliente es base + sobreprecio.
 */
const router = express.Router();

const AGENT_BPS = 1200n;
const PLATFORM_BPS = 300n;
const TOTAL_BPS = 10000n;
const u = (x) => ethers.formatUnits(x, 6); // bigint(6 dec) → string

function handle(res, e) {
  if (e.code === "BAD_INPUT") return res.status(400).json({ error: e.message });
  if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
  return res.status(500).json({ error: e.message });
}

/** Lee el paquete on-chain y arma el desglose comercial del link. */
async function breakdown(link, quantity = 1) {
  const qty = BigInt(Math.max(1, Number(quantity) || 1));
  const p = await chain.tourPackage().getPackage(link.packageId);
  if (p.provider === ethers.ZeroAddress) {
    const err = new Error("El paquete del link ya no existe");
    err.code = "NOT_FOUND";
    throw err;
  }
  const base = BigInt(p.price) * qty;
  const surcharge = ethers.parseUnits(link.surchargeUsdc || "0", 6);
  const platformFee = (base * PLATFORM_BPS) / TOTAL_BPS;
  const agentBase = (base * AGENT_BPS) / TOTAL_BPS;
  const providerNet = base - platformFee - agentBase;
  const agentTotal = agentBase + surcharge;
  const final = base + surcharge;

  return {
    package: {
      id: link.packageId,
      provider: p.provider,
      category: Number(p.category),
      name: p.name,
      priceUsdc: u(p.price),
      checkInDate: Number(p.checkInDate),
      checkOutDate: Number(p.checkOutDate),
      refundDeadline: Number(p.refundDeadline),
      active: p.active,
    },
    quantity: Number(qty),
    basePriceUsdc: u(base),
    surchargeUsdc: u(surcharge),
    platformFeeUsdc: u(platformFee),
    agentBaseCommissionUsdc: u(agentBase),
    agentCommissionUsdc: u(agentTotal),
    providerNetUsdc: u(providerNet),
    finalPriceUsdc: u(final),
  };
}

// POST /api/paylinks { agent, packageId, surchargeUsdc, note } — crea el link.
router.post("/", async (req, res) => {
  try {
    const { agent, packageId, surchargeUsdc, note } = req.body || {};
    if (!agent || !ethers.isAddress(agent)) {
      return res.status(400).json({ error: "agent (dirección) inválido" });
    }
    if (!(await chain.isChainUp())) {
      return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node`." });
    }
    const link = store.create({ agent, packageId, surchargeUsdc, note });
    const detail = await breakdown(link);
    res.status(201).json({ ...publicLink(link), ...detail });
  } catch (e) {
    handle(res, e);
  }
});

// GET /api/paylinks?agent=0x... — links de un agente, con sus ventas.
router.get("/", async (req, res) => {
  try {
    const agent = req.query.agent;
    if (!agent || !ethers.isAddress(String(agent))) {
      return res.status(400).json({ error: "query ?agent=0x... requerido" });
    }
    const links = store.listByAgent(String(agent));
    const up = await chain.isChainUp();
    const out = [];
    for (const link of links) {
      let detail = null;
      if (up) {
        try {
          detail = await breakdown(link);
        } catch {
          /* paquete borrado: devolvemos el link igual, sin desglose */
        }
      }
      out.push({ ...publicLink(link), sales: link.sales, ...(detail || {}) });
    }
    res.json({ agent: String(agent).toLowerCase(), count: out.length, links: out });
  } catch (e) {
    handle(res, e);
  }
});

// GET /api/paylinks/:code — datos públicos para la página de venta del cliente.
router.get("/:code", async (req, res) => {
  try {
    const link = store.get(req.params.code);
    if (!(await chain.isChainUp())) {
      return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node`." });
    }
    const detail = await breakdown(link, req.query.quantity);
    res.json({ ...publicLink(link), ...detail });
  } catch (e) {
    handle(res, e);
  }
});

// POST /api/paylinks/:code/sale — registra una venta concretada tras el pago.
router.post("/:code/sale", async (req, res) => {
  try {
    const link = store.get(req.params.code);
    const body = req.body || {};
    // Recalculamos los montos desde la cadena para no confiar en el cliente.
    let amounts = {};
    if (await chain.isChainUp()) {
      try {
        const d = await breakdown(link, body.quantity);
        amounts = {
          basePriceUsdc: d.basePriceUsdc,
          surchargeUsdc: d.surchargeUsdc,
          platformFeeUsdc: d.platformFeeUsdc,
          agentCommissionUsdc: d.agentCommissionUsdc,
          finalPriceUsdc: d.finalPriceUsdc,
        };
      } catch {
        /* sin desglose: guardamos lo que mandó el cliente */
      }
    }
    const sale = store.recordSale(link.code, { ...body, ...amounts });
    res.status(201).json({ code: link.code, agent: link.agent, sale });
  } catch (e) {
    handle(res, e);
  }
});

// POST /api/paylinks/:code/pay-gasless { email } — pago "sin wallet" del link.
// El cliente no necesita cripto: el backend deriva su Smart Account (mock MPC),
// le acredita el USDC (on-ramp), patrocina el gas y paga base + sobreprecio.
router.post("/:code/pay-gasless", async (req, res) => {
  try {
    const link = store.get(req.params.code);
    const email = req.body?.email;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "email válido requerido para el pago sin wallet" });
    }
    if (!(await chain.isChainUp())) {
      return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node`." });
    }

    const account = aa.smartAccountFor(email); // ethers.Wallet derivada del email
    if (account.address.toLowerCase() === link.agent.toLowerCase()) {
      return res.status(400).json({ error: "El agente no puede ser el comprador" });
    }

    const d = await breakdown(link);
    const base = ethers.parseUnits(d.basePriceUsdc, 6);
    const surcharge = ethers.parseUnits(d.surchargeUsdc, 6);
    const total = base + surcharge;
    const agent = link.agent;

    // Cuenta de servicio (on-ramp + Paymaster) con NonceManager para tx seguidas.
    const service = new ethers.NonceManager(chain.onrampSigner());

    // 1. Asegurar USDC (base + sobreprecio) en la Smart Account (simula on-ramp).
    const usdcRead = chain.usdc();
    const balance = await usdcRead.balanceOf(account.address);
    if (balance < total) {
      await (await chain.usdc(service).mint(account.address, total - balance)).wait();
    }

    // 2. El Paymaster patrocina el gas (la cuenta no tiene ETH nativo).
    await aa.sponsorGas(account.address, service);

    // La Smart Account manda approve + purchase + transfer: NonceManager.
    const signer = new ethers.NonceManager(account);
    const escrowAddr = chain.escrow().target;

    // 3. Approve del escrow para la base (si hace falta).
    if (base > 0n) {
      const allowance = await usdcRead.allowance(account.address, escrowAddr);
      if (allowance < base) {
        await (await chain.usdc(signer).approve(escrowAddr, base)).wait();
      }
    }

    // 4. Compra de la base (retiene en escrow + mintea la reserva).
    const escrow = chain.escrow(signer);
    const receipt = await (await escrow.purchase(link.packageId, 1, agent)).wait();
    let bookingId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = escrow.interface.parseLog(log);
        if (parsed?.name === "Purchased") {
          bookingId = Number(parsed.args.bookingId);
          break;
        }
      } catch {
        /* log de otro contrato */
      }
    }

    // 5. Sobreprecio: transferencia USDC directa al agente desde la Smart Account.
    let surchargeTxHash = null;
    if (surcharge > 0n) {
      const st = await (await chain.usdc(signer).transfer(agent, surcharge)).wait();
      surchargeTxHash = st.hash;
    }

    // 6. Registrar la venta (con el desglose, igual que el flujo con wallet).
    const sale = store.recordSale(link.code, {
      bookingId,
      customer: account.address,
      wallet: account.address,
      email,
      txHash: receipt.hash,
      surchargeTxHash,
      quantity: 1,
      basePriceUsdc: d.basePriceUsdc,
      surchargeUsdc: d.surchargeUsdc,
      platformFeeUsdc: d.platformFeeUsdc,
      agentCommissionUsdc: d.agentCommissionUsdc,
      finalPriceUsdc: d.finalPriceUsdc,
    });

    res.status(201).json({
      smartAccount: account.address,
      bookingId,
      txHash: receipt.hash,
      surchargeTxHash,
      basePriceUsdc: d.basePriceUsdc,
      surchargeUsdc: d.surchargeUsdc,
      finalPriceUsdc: d.finalPriceUsdc,
      gasSponsored: true,
      sale,
    });
  } catch (e) {
    handle(res, e);
  }
});

/** Campos del link seguros para exponer (sin la lista de ventas privadas). */
function publicLink(link) {
  return {
    code: link.code,
    agent: link.agent,
    packageId: link.packageId,
    note: link.note,
    createdAt: link.createdAt,
    salesCount: link.sales.length,
  };
}

module.exports = router;
