"use client";

import { AuthGate } from "@/components/AuthGate";
import { ConnectGate } from "@/components/ConnectGate";
import { MyReservations } from "@/components/MyReservations";

export default function ReservasPage() {
  return (
    <AuthGate>
      <div className="space-y-8">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Mis reservas</h1>
          <p className="mt-1 text-slate-500">
            Tus paquetes reservados. Mientras el servicio no se confirme, el pago queda en escrow y
            podés cancelar dentro del plazo de la política.
          </p>
        </div>

        <ConnectGate>{(address) => <MyReservations owner={address} />}</ConnectGate>
      </div>
    </AuthGate>
  );
}
