"use client";

import { ConnectGate } from "@/components/ConnectGate";
import { MarketListings } from "@/components/MarketListings";
import { ResellReservation } from "@/components/ResellReservation";

export default function MercadoPage() {
  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Mercado secundario</h1>
        <p className="mt-1 max-w-2xl text-slate-500">
          ¿No podés viajar? Revendé tu reserva a otro viajero. A diferencia de las OTAs
          tradicionales, acá la reventa está permitida: vos recuperás tu plata y el proveedor
          original cobra un royalty forzoso del 5% (RF-C02).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reservas en reventa</h2>
        <MarketListings />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revender mi reserva</h2>
        <ConnectGate>{(address) => <ResellReservation owner={address} />}</ConnectGate>
      </section>
    </div>
  );
}
