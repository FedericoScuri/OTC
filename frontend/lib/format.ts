import { formatUnits } from "viem";

/** USDC usa 6 decimales (igual que el USDC real). */
export const USDC_DECIMALS = 6;

/** Formatea un monto en USDC (bigint, 6 decimales) como "1,234.50 USDC". */
export function formatUSDC(amount: bigint): string {
  const n = Number(formatUnits(amount, USDC_DECIMALS));
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Acorta una direccion: 0x1234...abcd */
export function shortAddress(addr?: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Timestamp (segundos, bigint o number) -> fecha legible es-AR. */
export function formatDate(ts: bigint | number): string {
  const seconds = typeof ts === "bigint" ? Number(ts) : ts;
  return new Date(seconds * 1000).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const CATEGORY_LABELS = ["Hotel", "Bodega", "Aventura", "Cultural"] as const;

export function categoryLabel(cat: number): string {
  return CATEGORY_LABELS[cat] ?? "Otro";
}
