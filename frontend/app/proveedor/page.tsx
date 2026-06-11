"use client";

import { ConnectGate } from "@/components/ConnectGate";
import { CreatePackageForm } from "@/components/CreatePackageForm";
import { ProviderPackages } from "@/components/ProviderPackages";
import { ProviderBookings } from "@/components/ProviderBookings";

export default function ProveedorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel del proveedor</h1>
        <p className="text-slate-500">
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
  );
}
