"use client";

/**
 * Cliente del backend OTC (API REST). El frontend habla con los contratos vía
 * wagmi, pero algunas features viven en el backend (capa intermedia del PDR):
 * KYC/KYB (RF-A02), Account Abstraction / compra gasless (RF-A01) y el Guardián
 * de Latencia anti-overbooking (RNF-P01).
 *
 * Base URL configurable con NEXT_PUBLIC_BACKEND_URL (default localhost:4000).
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export class BackendError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new BackendError("No se pudo conectar con el backend (¿está corriendo en :4000?)", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BackendError(body?.error || `Error ${res.status}`, res.status, body?.code);
  }
  return body as T;
}

export const backend = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
};

// --- Tipos de respuesta usados por la UI ---

export type Availability = {
  packageId: number;
  name: string;
  maxSupply: number;
  minted: number;
  available: number;
  held: number;
  free: number;
  latencyMs: number;
  budgetMs: number;
};

export type GaslessPurchase = {
  smartAccount: string;
  packageId: number;
  quantity: number;
  agent: string | null;
  priceUsdc: string;
  bookingId: number | null;
  purchaseTxHash: string;
  gasSponsored: { sponsored: boolean; amountEth?: string };
  userHeldNativeCrypto: boolean;
};

// --- Flujo de venta por agente (link de pago con sobreprecio) ---

export type PayLinkPackage = {
  id: number;
  provider: string;
  category: number;
  name: string;
  priceUsdc: string;
  checkInDate: number;
  checkOutDate: number;
  refundDeadline: number;
  active: boolean;
};

export type PayLinkBreakdown = {
  package: PayLinkPackage;
  quantity: number;
  basePriceUsdc: string;
  surchargeUsdc: string;
  platformFeeUsdc: string;
  agentBaseCommissionUsdc: string;
  agentCommissionUsdc: string;
  providerNetUsdc: string;
  finalPriceUsdc: string;
};

export type PayLinkSale = {
  bookingId: number | null;
  customer: string | null;
  email: string | null;
  phone: string | null;
  wallet: string | null;
  txHash: string | null;
  surchargeTxHash: string | null;
  quantity: number;
  basePriceUsdc: string | null;
  surchargeUsdc: string | null;
  platformFeeUsdc: string | null;
  agentCommissionUsdc: string | null;
  finalPriceUsdc: string | null;
  status: string;
  createdAt: string;
};

/** Link de pago (datos públicos del link + desglose comercial). */
export type PayLink = {
  code: string;
  agent: string;
  packageId: number;
  note: string;
  createdAt: string;
  salesCount: number;
} & Partial<PayLinkBreakdown>;

export type PayLinkWithSales = PayLink & { sales: PayLinkSale[] };

export type KybStatusValue = "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
export type KybRecord = {
  provider: string;
  status: KybStatusValue;
  legalName?: string;
  taxId?: string;
  country?: string;
  submittedAt?: string;
  decidedAt?: string | null;
};
