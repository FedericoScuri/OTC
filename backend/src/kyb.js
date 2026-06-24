/**
 * RF-A02 — KYC/KYB automatizado de proveedores.
 *
 * Pipeline legal digital simplificado: un proveedor (hotel, bodega) envía sus
 * datos, queda en revisión y, una vez verificado, recién ahí puede publicar
 * inventario. Para la demo el "pipeline" es un mock en memoria con verificación
 * manual/automática; en producción sería un proveedor de KYB real + firma legal.
 *
 * Estados: NONE (sin trámite) → PENDING (enviado) → VERIFIED / REJECTED.
 */

const STATUS = { NONE: "NONE", PENDING: "PENDING", VERIFIED: "VERIFIED", REJECTED: "REJECTED" };

// providerKey (dirección lowercase) => { status, legalName, taxId, country, submittedAt, decidedAt }
const records = new Map();

function key(provider) {
  if (!provider || typeof provider !== "string") {
    const err = new Error("provider requerido");
    err.code = "BAD_INPUT";
    throw err;
  }
  return provider.trim().toLowerCase();
}

/** Devuelve el trámite del proveedor (o NONE si no existe). */
function getStatus(provider) {
  const rec = records.get(key(provider));
  if (!rec) return { provider: key(provider), status: STATUS.NONE };
  return { provider: key(provider), ...rec };
}

function isVerified(provider) {
  return records.get(key(provider))?.status === STATUS.VERIFIED;
}

/** Un proveedor envía su KYB. Si reenvía, vuelve a PENDING. */
function submit(provider, data = {}) {
  const k = key(provider);
  if (!data.legalName || !data.taxId || !data.country) {
    const err = new Error("legalName, taxId y country son requeridos");
    err.code = "BAD_INPUT";
    throw err;
  }
  const rec = {
    status: STATUS.PENDING,
    legalName: String(data.legalName),
    taxId: String(data.taxId),
    country: String(data.country).toUpperCase(),
    submittedAt: nowIso(),
    decidedAt: null,
  };
  records.set(k, rec);
  return { provider: k, ...rec };
}

/** Resolución del trámite (en la demo, manual/admin; en prod, el proveedor KYB). */
function decide(provider, approve) {
  const k = key(provider);
  const rec = records.get(k);
  if (!rec) {
    const err = new Error("El proveedor no tiene un trámite KYB enviado");
    err.code = "NOT_FOUND";
    throw err;
  }
  rec.status = approve ? STATUS.VERIFIED : STATUS.REJECTED;
  rec.decidedAt = nowIso();
  return { provider: k, ...rec };
}

function list() {
  return [...records.entries()].map(([provider, rec]) => ({ provider, ...rec }));
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = { STATUS, getStatus, isVerified, submit, decide, list };
