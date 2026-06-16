"use client";

import { ConnectGate } from "@/components/ConnectGate";
import { AffiliateLink } from "@/components/AffiliateLink";
import { AgentDashboard } from "@/components/AgentDashboard";

export default function AgentePage() {
  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Panel del agente</h1>
        <p className="mt-1 text-slate-500">
          Generá tu link de afiliado y seguí tus comisiones. Cobrás el 12% de cada venta cuando el
          proveedor confirma el servicio.
        </p>
      </div>

      <ConnectGate>
        {(address) => (
          <div className="space-y-8">
            <AffiliateLink agent={address} />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Mis comisiones</h2>
              <AgentDashboard agent={address} />
            </section>
          </div>
        )}
      </ConnectGate>
    </div>
  );
}
