"use client";

import { useState } from "react";

/**
 * Generador de link de afiliado (RF-D02). Arma una URL al catálogo con
 * ?ref=<agente>; quien compre por ese link le paga al agente su 12%.
 */
export function AffiliateLink({ agent }: { agent: `0x${string}` }) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/catalogo?ref=${agent}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="glass animate-fade-in-up space-y-3 rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Tu link de afiliado</h2>
      <p className="text-sm text-slate-500">
        Compartí este link. Cada compra hecha a través de él te asigna como agente y te paga el{" "}
        <span className="font-semibold text-brand">12%</span> automáticamente cuando el proveedor
        confirma el servicio.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700"
        />
        <button
          onClick={copy}
          className="btn-primary shine shrink-0"
        >
          {copied ? "¡Copiado! ✓" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
