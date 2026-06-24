const express = require("express");
const kyb = require("../kyb");

/**
 * RF-A02 — KYC/KYB de proveedores. Trámite y resolución; el gate real que impide
 * publicar inventario sin verificación vive en `/api/pms/sync`.
 */
const router = express.Router();

function handle(res, e) {
  if (e.code === "BAD_INPUT") return res.status(400).json({ error: e.message });
  if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
  return res.status(500).json({ error: e.message });
}

// POST /api/kyb/submit { provider, legalName, taxId, country } — envía el KYB.
router.post("/submit", (req, res) => {
  try {
    res.status(201).json(kyb.submit(req.body?.provider, req.body));
  } catch (e) {
    handle(res, e);
  }
});

// GET /api/kyb/status/:provider — estado del trámite de un proveedor.
router.get("/status/:provider", (req, res) => {
  try {
    res.json(kyb.getStatus(req.params.provider));
  } catch (e) {
    handle(res, e);
  }
});

// POST /api/kyb/decide { provider, approve } — resolución (admin/demo).
router.post("/decide", (req, res) => {
  try {
    res.json(kyb.decide(req.body?.provider, req.body?.approve === true));
  } catch (e) {
    handle(res, e);
  }
});

// GET /api/kyb/list — todos los trámites (panel admin / debug).
router.get("/list", (_req, res) => {
  res.json({ records: kyb.list() });
});

module.exports = router;
