/**
 * RNF-P01 / PDR §2.2 — Capa Guardián de Latencia (anti-overbooking).
 *
 * Modela, en memoria, dos piezas que el PDR ubica en la "capa intermedia":
 *
 *  1. Presupuesto de latencia: toda operación de sincronización tiene un tope
 *     duro de 800ms de punta a punta. Si lo supera, se aborta (en vez de dejar
 *     una respuesta lenta que habilite ventas simultáneas de la misma unidad).
 *
 *  2. Bloqueo lógico temporal de inventario: mientras la transacción on-chain
 *     se confirma, se reserva el cupo con un "hold" con TTL. Dos compradores
 *     que apuntan a la última unidad no pueden pasar los dos → se evita el
 *     overbooking (riesgo ALTO/ALTA del análisis del PDR §4).
 *
 * En producción esto vive sobre colas (RabbitMQ/Kafka) y una DB; acá alcanza
 * con estructuras en memoria para demostrar el comportamiento.
 */

// Tope de respuesta de punta a punta (PDR §2.2). Configurable por si se afina.
const LATENCY_BUDGET_MS = Number(process.env.LATENCY_BUDGET_MS) || 800;

// Cuánto dura el bloqueo lógico mientras la tx blockchain se confirma.
const HOLD_TTL_MS = Number(process.env.HOLD_TTL_MS) || 30_000;

class LatencyExceededError extends Error {
  constructor(label, ms) {
    super(`Guardián de latencia: "${label}" superó el presupuesto de ${LATENCY_BUDGET_MS}ms (tardó ${ms}ms)`);
    this.name = "LatencyExceededError";
    this.code = "LATENCY_EXCEEDED";
  }
}

class OverbookingError extends Error {
  constructor(packageId, requested, available) {
    super(`Overbooking bloqueado en el paquete ${packageId}: pediste ${requested} y quedan ${available} (descontando holds activos)`);
    this.name = "OverbookingError";
    this.code = "OVERBOOKING";
  }
}

/**
 * Ejecuta `fn` con el presupuesto de latencia. Resuelve `{ result, ms }` si
 * termina a tiempo; lanza `LatencyExceededError` si supera el tope.
 */
async function withLatencyBudget(label, fn) {
  const start = process.hrtime.bigint();
  let timer;
  const budget = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new LatencyExceededError(label, LATENCY_BUDGET_MS)), LATENCY_BUDGET_MS);
  });
  try {
    const result = await Promise.race([Promise.resolve().then(fn), budget]);
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    return { result, ms: Math.round(ms) };
  } finally {
    clearTimeout(timer);
  }
}

// packageId (string) => [{ token, qty, expiresAt }]
const holds = new Map();
let holdSeq = 0;

/** Quita los holds vencidos de un paquete y devuelve los que siguen activos. */
function activeHolds(packageId) {
  const key = String(packageId);
  const now = Date.now();
  const live = (holds.get(key) || []).filter((h) => h.expiresAt > now);
  if (live.length) holds.set(key, live);
  else holds.delete(key);
  return live;
}

/** Unidades actualmente retenidas (no vencidas) de un paquete. */
function heldQty(packageId) {
  return activeHolds(packageId).reduce((sum, h) => sum + h.qty, 0);
}

/**
 * Intenta retener `qty` unidades de un paquete dado el cupo realmente
 * disponible on-chain (`onChainAvailable` = maxSupply - minted). Lanza
 * `OverbookingError` si los holds activos + lo pedido excederían el cupo.
 * @returns {{ token: string, expiresAt: number }}
 */
function acquireHold(packageId, qty, onChainAvailable) {
  const key = String(packageId);
  const free = onChainAvailable - heldQty(key);
  if (qty > free) throw new OverbookingError(packageId, qty, Math.max(free, 0));

  const token = `hold_${++holdSeq}_${packageId}`;
  const entry = { token, qty, expiresAt: Date.now() + HOLD_TTL_MS };
  const list = holds.get(key) || [];
  list.push(entry);
  holds.set(key, list);
  return { token, expiresAt: entry.expiresAt };
}

/** Libera un hold (al confirmarse el mint on-chain o al cancelarse). */
function releaseHold(packageId, token) {
  const key = String(packageId);
  const list = activeHolds(key).filter((h) => h.token !== token);
  if (list.length) holds.set(key, list);
  else holds.delete(key);
  return true;
}

/** Snapshot de holds activos (para debug / panel). */
function snapshot() {
  const out = {};
  for (const key of holds.keys()) {
    const live = activeHolds(key);
    if (live.length) out[key] = { units: heldQty(key), holds: live.length };
  }
  return out;
}

module.exports = {
  LATENCY_BUDGET_MS,
  HOLD_TTL_MS,
  LatencyExceededError,
  OverbookingError,
  withLatencyBudget,
  acquireHold,
  releaseHold,
  heldQty,
  snapshot,
};
