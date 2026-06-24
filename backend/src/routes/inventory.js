const express = require("express");
const chain = require("../chain");
const guard = require("../latency-guard");

/**
 * RNF-P01 / PDR §2.2 — Capa Guardián de Latencia sobre el inventario.
 *
 * Expone el cupo disponible (descontando holds activos) y permite tomar/soltar
 * bloqueos lógicos temporales mientras la compra se confirma on-chain. Toda
 * lectura/operación corre dentro del presupuesto de 800ms (`withLatencyBudget`).
 */
const router = express.Router();

/** Cupo disponible real de un paquete leído de la cadena. */
async function onChainAvailable(packageId) {
  const nft = chain.tourPackage();
  const p = await nft.getPackage(packageId);
  if (p.provider === "0x0000000000000000000000000000000000000000") {
    const err = new Error("Paquete inexistente");
    err.code = "NOT_FOUND";
    throw err;
  }
  return {
    name: p.name,
    maxSupply: Number(p.maxSupply),
    minted: Number(p.minted),
    available: Number(p.maxSupply) - Number(p.minted),
    active: p.active,
  };
}

/** Mapea los errores del guardián a códigos HTTP. */
function handle(res, e) {
  if (e.code === "LATENCY_EXCEEDED") return res.status(504).json({ error: e.message, code: e.code });
  if (e.code === "OVERBOOKING") return res.status(409).json({ error: e.message, code: e.code });
  if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
  return res.status(500).json({ error: e.message });
}

// GET /api/inventory/availability/:packageId — cupo libre (cadena − holds).
router.get("/availability/:packageId", async (req, res) => {
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }
  try {
    const { result, ms } = await guard.withLatencyBudget("availability", () =>
      onChainAvailable(req.params.packageId),
    );
    const held = guard.heldQty(req.params.packageId);
    res.json({
      packageId: Number(req.params.packageId),
      ...result,
      held,
      free: result.available - held,
      latencyMs: ms,
      budgetMs: guard.LATENCY_BUDGET_MS,
    });
  } catch (e) {
    handle(res, e);
  }
});

// POST /api/inventory/hold { packageId, qty } — toma un bloqueo lógico temporal.
router.post("/hold", async (req, res) => {
  const packageId = Number(req.body.packageId);
  const qty = Number(req.body.qty) || 1;
  if (!packageId || qty < 1) return res.status(400).json({ error: "packageId y qty (>=1) requeridos" });
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }
  try {
    const { result, ms } = await guard.withLatencyBudget("hold", async () => {
      const inv = await onChainAvailable(packageId);
      if (!inv.active) {
        const err = new Error("Paquete pausado por el proveedor");
        err.code = "NOT_FOUND";
        throw err;
      }
      return guard.acquireHold(packageId, qty, inv.available);
    });
    res.status(201).json({
      packageId,
      qty,
      token: result.token,
      expiresAt: result.expiresAt,
      ttlMs: guard.HOLD_TTL_MS,
      latencyMs: ms,
    });
  } catch (e) {
    handle(res, e);
  }
});

// POST /api/inventory/release { packageId, token } — suelta el bloqueo.
router.post("/release", (req, res) => {
  const packageId = Number(req.body.packageId);
  const token = req.body.token;
  if (!packageId || !token) return res.status(400).json({ error: "packageId y token requeridos" });
  guard.releaseHold(packageId, token);
  res.json({ released: true, packageId, token });
});

// GET /api/inventory/holds — holds activos (para el panel / debug).
router.get("/holds", (_req, res) => {
  res.json({ active: guard.snapshot(), budgetMs: guard.LATENCY_BUDGET_MS, holdTtlMs: guard.HOLD_TTL_MS });
});

module.exports = router;
