/** Traduce errores de transacción a un mensaje corto y legible. */
export function parseError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // Mensajes de require() del contrato: "...reason: Escrow: ..."
  const match = msg.match(/(Escrow|TourPackageNFT|Market): [^"\n]+/);
  if (match) return match[0];
  if (msg.includes("User rejected") || msg.includes("rejected the request")) {
    return "Cancelaste la transacción.";
  }
  return "No se pudo completar la operación.";
}
