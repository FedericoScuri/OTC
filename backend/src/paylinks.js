/**
 * Flujo de venta por agente intermedio — links de pago con sobreprecio.
 *
 * Un agente genera un link único (`/pay/<CODIGO>`) para un paquete, agregándole
 * su propio sobreprecio. El cliente final abre el link, ve el producto y el
 * precio final (con el disclaimer de comisiones) y paga on-chain. La venta queda
 * asociada al agente con todos sus datos (cliente, wallet, hash, comisiones).
 *
 * Store en memoria para la demo (igual que el KYB). En producción sería una base
 * de datos persistente. El cobro del paquete usa el escrow existente (reparto
 * 85/12/3, el agente cobra su 12% real on-chain); el sobreprecio se cobra como
 * una transferencia USDC directa al agente en el mismo flujo de pago.
 */
const crypto = require("crypto");

// Alfabeto sin caracteres confusos (O/0, I/1) para códigos legibles.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// code => { code, agent, packageId, surchargeUsdc, note, createdAt, sales: [] }
const links = new Map();

function genCode(len = 8) {
  let code;
  do {
    code = Array.from(crypto.randomBytes(len))
      .map((b) => ALPHABET[b % ALPHABET.length])
      .join("");
  } while (links.has(code));
  return code;
}

function badInput(message) {
  const err = new Error(message);
  err.code = "BAD_INPUT";
  return err;
}

/** Crea un link de venta para un agente. `surchargeUsdc` es un monto decimal. */
function create({ agent, packageId, surchargeUsdc, note } = {}) {
  if (!agent || typeof agent !== "string") throw badInput("agent requerido");
  const pkg = Number(packageId);
  if (!Number.isInteger(pkg) || pkg < 1) throw badInput("packageId inválido");
  const surcharge = String(surchargeUsdc ?? "0").trim();
  if (!/^\d+(\.\d{1,6})?$/.test(surcharge)) throw badInput("sobreprecio inválido (máx. 6 decimales)");

  const rec = {
    code: genCode(),
    agent: agent.toLowerCase(),
    packageId: pkg,
    surchargeUsdc: surcharge,
    note: note ? String(note).slice(0, 280) : "",
    createdAt: new Date().toISOString(),
    sales: [],
  };
  links.set(rec.code, rec);
  return rec;
}

/** Devuelve el link por código (lanza NOT_FOUND si no existe). */
function get(code) {
  const rec = links.get(String(code || "").toUpperCase());
  if (!rec) {
    const err = new Error("Link de venta inexistente");
    err.code = "NOT_FOUND";
    throw err;
  }
  return rec;
}

/** Links creados por un agente (con sus ventas). */
function listByAgent(agent) {
  const a = String(agent || "").toLowerCase();
  return [...links.values()].filter((l) => l.agent === a);
}

/** Registra una venta concretada sobre un link. */
function recordSale(code, sale = {}) {
  const rec = get(code);
  const entry = {
    bookingId: sale.bookingId ?? null,
    customer: sale.customer ?? null,
    email: sale.email ?? null,
    phone: sale.phone ?? null,
    wallet: sale.wallet ?? null,
    txHash: sale.txHash ?? null,
    surchargeTxHash: sale.surchargeTxHash ?? null,
    quantity: Number(sale.quantity) || 1,
    basePriceUsdc: sale.basePriceUsdc ?? null,
    surchargeUsdc: sale.surchargeUsdc ?? rec.surchargeUsdc,
    platformFeeUsdc: sale.platformFeeUsdc ?? null,
    agentCommissionUsdc: sale.agentCommissionUsdc ?? null,
    finalPriceUsdc: sale.finalPriceUsdc ?? null,
    status: sale.status ?? "PAID",
    createdAt: new Date().toISOString(),
  };
  rec.sales.push(entry);
  return entry;
}

module.exports = { create, get, listByAgent, recordSale, all: () => [...links.values()] };
