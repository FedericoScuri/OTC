const express = require("express");
const { ethers } = require("ethers");
const chain = require("../chain");
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
