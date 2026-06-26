"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { backend, type PayLink, type PayLinkBreakdown } from "@/lib/backend";
import { PayLinkCheckout } from "@/components/PayLinkCheckout";
import { categoryLabel, formatDate } from "@/lib/format";
import { CheckIcon, MapPinIcon } from "@/components/icons";

type FullLink = PayLink & PayLinkBreakdown;

const GRAD: Record<number, string> = {
  0: "from-[#6d5bd0] to-[#b06fb8]",
  1: "from-[#c0506e] to-[#e0915f]",
  2: "from-[#4f7a6a] to-[#d98f5a]",
  3: "from-[#8a5cc0] to-[#d08fb0]",
};

function fmt(usdc: string | number | null | undefined): string {
  const n = Number(usdc ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayPage() {
  const { code } = useParams<{ code: string }>();
  const [link, setLink] = useState<FullLink | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    backend
      .get<FullLink>(`/api/paylinks/${code}`)
      .then((l) => {
        setLink(l);
        setError(undefined);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el link."))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return <p className="py-16 text-center text-slate-400">Cargando la oferta…</p>;
  }

  if (error || !link) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl p-10 text-center">
        <p className="text-lg font-semibold text-slate-800">Link de pago no disponible</p>
        <p className="mt-1 text-sm text-slate-500">{error ?? "El link no existe o expiró."}</p>
        <a href="/catalogo" className="btn-primary mt-5 inline-block">
          Ver el catálogo
        </a>
      </div>
    );
  }

  const p = link.package;
  const grad = GRAD[p.category] ?? GRAD[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* --- Información comercial --- */}
        <div className="animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <div className={`relative h-40 bg-gradient-to-br ${grad}`}>
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">
              {categoryLabel(p.category)}
            </span>
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-md bg-black/25 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <MapPinIcon size={13} /> Mendoza, Argentina
            </span>
          </div>
          <div className="space-y-4 p-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">{p.name}</h1>
              {link.note && <p className="mt-1 text-slate-600">{link.note}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Check-in" value={formatDate(p.checkInDate)} />
              <Info label="Check-out" value={formatDate(p.checkOutDate)} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Servicios incluidos</p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {[
                  "Reserva tokenizada como NFT (te pertenece y es revendible)",
                  "Pago protegido en escrow hasta la confirmación del servicio",
                  `Cancelación gratis hasta ${formatDate(p.refundDeadline)}`,
                  "Atención del agente intermediario que te compartió la oferta",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckIcon size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- Precio + disclaimer + checkout --- */}
        <div className="animate-fade-in-up space-y-4">
          <div className="glass rounded-3xl p-6">
            <p className="text-sm text-slate-500">Precio final</p>
            <p className="text-4xl font-extrabold text-brand-dark">
              {fmt(link.finalPriceUsdc)} <span className="text-lg font-semibold text-slate-400">USDC</span>
            </p>

            {/* Disclaimer de comisiones */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm">
              <p className="font-medium text-amber-800">
                El precio publicado incluye las comisiones correspondientes al intermediario
                comercial.
              </p>
              <div className="mt-3 space-y-1 text-amber-900/80">
                <Line label="Precio base del paquete" value={fmt(link.basePriceUsdc)} />
                <Line label="Sobreprecio del intermediario" value={fmt(link.surchargeUsdc)} />
                <div className="my-1 border-t border-amber-200" />
                <Line label="Precio final" value={fmt(link.finalPriceUsdc)} strong />
              </div>
              <details className="mt-3 text-xs text-amber-900/70">
                <summary className="cursor-pointer">Cómo se reparte</summary>
                <div className="mt-2 space-y-1">
                  <Line label="Operador (proveedor)" value={fmt(link.providerNetUsdc)} />
                  <Line label="Comisión plataforma" value={fmt(link.platformFeeUsdc)} />
                  <Line label="Comisión agente" value={fmt(link.agentCommissionUsdc)} />
                </div>
              </details>
              <p className="mt-3 text-xs text-amber-900/60">
                Los importes son informativos y pueden variar según el paquete contratado.
              </p>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Completá tu reserva</h2>
            <PayLinkCheckout code={String(code)} link={link} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value} USDC</span>
    </div>
  );
}
