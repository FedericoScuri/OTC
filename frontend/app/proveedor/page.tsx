"use client";

import { AuthGate } from "@/components/AuthGate";
import { ConnectGate } from "@/components/ConnectGate";
import { CreatePackageForm } from "@/components/CreatePackageForm";
import { ProviderPackages } from "@/components/ProviderPackages";
import { ProviderBookings } from "@/components/ProviderBookings";

export default function ProveedorPage() {
  return (
    <AuthGate role="proveedor">
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Panel del proveedor</h1>
        <p className="mt-1 text-slate-500">
          Publicá paquetes y confirmá los servicios prestados para liberar los fondos retenidos en
          el escrow.
        </p>
      </div>

      <ConnectGate>
        {(address) => (
          <div className="space-y-8">
            <CreatePackageForm />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Reservas pendientes</h2>
              <ProviderBookings provider={address} />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Mis paquetes</h2>
              <ProviderPackages provider={address} />
            </section>
          </div>
        )}
      </ConnectGate>
    </div>
    </AuthGate>
  );
}
