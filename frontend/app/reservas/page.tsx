"use client";

import { useAccount } from "wagmi";
import { AuthGate } from "@/components/AuthGate";
import { MyReservations } from "@/components/MyReservations";
import { WalletButton } from "@/components/WalletButton";

export default function ReservasPage() {
  const { address } = useAccount();

  return (
    <AuthGate>
      <div className="space-y-8">
        <div className="animate-fade-in-up flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Mis reservas</h1>
            <p className="mt-1 text-slate-500">
              Tus paquetes reservados (con o sin wallet). Mientras el servicio no se confirme, el
              pago queda en escrow y podés cancelar dentro del plazo de la política.
            </p>
          </div>
          {!address && (
            <div className="shrink-0 text-right">
              <WalletButton />
              <p className="mt-1 text-xs text-slate-400">
                Conectá tu wallet para ver también las reservas hechas con MetaMask.
              </p>
            </div>
          )}
        </div>

        <MyReservations owner={address} />
      </div>
    </AuthGate>
  );
}
