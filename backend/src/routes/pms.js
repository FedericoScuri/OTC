const express = require("express");
const { ethers } = require("ethers");
const chain = require("../chain");
const inventory = require("../data/pms-inventory.json");

/**
 * RF-B01 — Sincronización con PMS/CRS.
 *
 * Simula el sistema de gestión hotelera (PMS/CRS) del proveedor: expone su
 * inventario externo y lo "sincroniza" publicándolo on-chain como paquetes
 * (TourPackageNFT.createPackage). Así el inventario tradicional aparece en el
 * marketplace descentralizado sin carga manual.
 */
const router = express.Router();

const DAY = 24 * 3600;

/** Convierte un item del PMS a los argumentos de createPackage. */
function toPackageArgs(item) {
  const now = Math.floor(Date.now() / 1000);
  const checkIn = now + item.checkInDays * DAY;
  const checkOut = checkIn + item.durationDays * DAY;
  const refundDeadline = checkIn - item.refundWindowDays * DAY;
  return {
    category: item.category,
    name: item.name,
    price: ethers.parseUnits(String(item.pricePerUnitUsd), 6),
    checkIn,
    checkOut,
    refundDeadline,
    maxSupply: item.maxSupply,
  };
}

// GET /api/pms/inventory — inventario externo del proveedor (sin tocar la cadena).
router.get("/inventory", (_req, res) => {
  res.json({ source: inventory.source, count: inventory.items.length, items: inventory.items });
});

// GET /api/pms/inventory/:extId — un item puntual.
router.get("/inventory/:extId", (req, res) => {
  const item = inventory.items.find((i) => i.extId === req.params.extId);
  if (!item) return res.status(404).json({ error: "Item no encontrado en el PMS" });
  res.json(item);
});

/**
 * GET /api/pms/sync-status — compara el inventario del PMS con lo que ya está
 * on-chain (deduplicando por nombre) para saber qué falta sincronizar.
 */
router.get("/sync-status", async (_req, res) => {
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }
  try {
    const onChainNames = await readOnChainNames();
    const items = inventory.items.map((i) => ({
      extId: i.extId,
      name: i.name,
      synced: onChainNames.has(i.name),
    }));
    res.json({ onChain: onChainNames.size, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/pms/sync — publica on-chain los items del PMS que todavía no están
 * (dedup por nombre). Devuelve los paquetes creados.
 */
router.post("/sync", async (_req, res) => {
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }
  try {
    const onChainNames = await readOnChainNames();
    // NonceManager lleva el nonce localmente: evita el "nonce too low" al mandar
    // varias createPackage seguidas (el nodo puede devolver un nonce stale).
    const signer = new ethers.NonceManager(chain.providerSigner());
    const nft = chain.tourPackage(signer);

    const created = [];
    const skipped = [];
    for (const item of inventory.items) {
      if (onChainNames.has(item.name)) {
        skipped.push(item.extId);
        continue;
      }
      const a = toPackageArgs(item);
      const tx = await nft.createPackage(
        a.category,
        a.name,
        a.price,
        a.checkIn,
        a.checkOut,
        a.refundDeadline,
        a.maxSupply,
      );
      const receipt = await tx.wait();
      created.push({ extId: item.extId, name: item.name, txHash: receipt.hash });
    }

    res.json({ created, skipped, createdCount: created.length, skippedCount: skipped.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Lee los nombres de los paquetes ya publicados on-chain. */
async function readOnChainNames() {
  const nft = chain.tourPackage();
  const total = Number(await nft.totalPackages());
  const names = new Set();
  for (let id = 1; id <= total; id++) {
    const p = await nft.getPackage(id);
    names.add(p.name);
  }
  return names;
}

module.exports = router;
