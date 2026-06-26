"use client";

import { useEffect, useMemo, useState } from "react";
import { backend, type PayLinkWithSales, type PayLinkSale } from "@/lib/backend";
import { shortAddress } from "@/lib/format";

type SaleRow = PayLinkSale & { code: string; packageName: string };

function fmt(usdc: string | number | null | undefined): string {
  const n = Number(usdc ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * RF-D02 — Registro y liquidación de comisiones del agente. Lista todas las
 * ventas hechas por sus links de pago, con los datos mínimos de cada reserva, y
 * permite exportar el reporte (CSV). El sobreprecio ya está cobrado por el
 * agente; el 12% del base se libera cuando el proveedor confirma el servicio.
 */
export function AgentSalesReport({ agent }: { agent: `0x${string}` }) {
  const [links, setLinks] = useState<PayLinkWithSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    backend
      .get<{ links: PayLinkWithSales[] }>(`/api/paylinks?agent=${agent}`)
      .then((res) => {
        if (!cancelled) setLinks(res.links);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agent]);

  const sales: SaleRow[] = useMemo(
    () =>
      links
        .flatMap((l) =>
          l.sales.map((s) => ({ ...s, code: l.code, packageName: l.package?.name ?? `Paquete #${l.packageId}` })),
        )
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [links],
  );

  const totals = useMemo(() => {
    let surcharge = 0;
    let commission = 0;
    for (const s of sales) {
      surcharge += Number(s.surchargeUsdc ?? 0);
      commission += Number(s.agentCommissionUsdc ?? 0);
    }
    return { count: sales.length, surcharge, commission };
  }, [sales]);

  function exportCsv() {
    const cols = [
      "ID Reserva", "Codigo Link", "Paquete", "Cliente/Wallet", "Email", "Telefono",
      "Hash Blockchain", "Hash Sobreprecio", "Precio Base", "Sobreprecio",
      "Comision Plataforma", "Comision Agente", "Precio Final", "Estado", "Fecha",
    ];
    const rows = sales.map((s) => [
      s.bookingId ?? "", s.code, s.packageName, s.wallet ?? s.customer ?? "", s.email ?? "",
      s.phone ?? "", s.txHash ?? "", s.surchargeTxHash ?? "", s.basePriceUsdc ?? "",
      s.surchargeUsdc ?? "", s.platformFeeUsdc ?? "", s.agentCommissionUsdc ?? "",
      s.finalPriceUsdc ?? "", s.status, s.createdAt,
    ]);
    const csv = [cols, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `liquidacion-${agent.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-slate-400">Cargando ventas por link…</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ventas por link" value={`${totals.count}`} />
        <Stat label="Sobreprecio cobrado" value={`${fmt(totals.surcharge)} USDC`} accent />
        <Stat label="Comisión agente total" value={`${fmt(totals.commission)} USDC`} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          El sobreprecio ya está en tu wallet; el 12% del base se libera al confirmarse el servicio.
        </p>
        <button
          onClick={exportCsv}
          disabled={sales.length === 0}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand ring-1 ring-brand/30 hover:bg-brand/5 disabled:opacity-40"
        >
          Descargar reporte (CSV)
        </button>
      </div>

      {sales.length === 0 ? (
        <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
          Todavía no hay ventas por tus links. Cuando un cliente pague por un link, la reserva
          aparece acá con todos sus datos.
        </p>
      ) : (
        <div className="space-y-3">
          {sales.map((s, i) => (
            <div key={`${s.code}-${i}`} className="glass rounded-2xl p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">
                  {s.packageName}{" "}
                  <span className="font-normal text-slate-400">
                    · reserva {s.bookingId ? `#${s.bookingId}` : "—"} · link {s.code}
                  </span>
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {s.status}
                </span>
              </div>

              <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                <Field label="Cliente" value={s.email || shortAddress(s.wallet || s.customer || "")} />
                <Field label="Teléfono" value={s.phone || "—"} />
                <Field label="Wallet" value={shortAddress(s.wallet || s.customer || "")} mono />
                <Field label="Hash" value={shortAddress(s.txHash || "")} mono />
                <Field label="Precio base" value={`${fmt(s.basePriceUsdc)} USDC`} />
                <Field label="Sobreprecio" value={`${fmt(s.surchargeUsdc)} USDC`} />
                <Field label="Comisión plataforma" value={`${fmt(s.platformFeeUsdc)} USDC`} />
                <Field label="Tu comisión" value={`${fmt(s.agentCommissionUsdc)} USDC`} strong />
                <Field label="Precio final" value={`${fmt(s.finalPriceUsdc)} USDC`} />
                <Field label="Fecha" value={fecha(s.createdAt)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass card-hover rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-brand" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${strong ? "font-semibold text-brand" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}
