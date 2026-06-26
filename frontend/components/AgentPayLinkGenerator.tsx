"use client";

import { useEffect, useMemo, useState } from "react";
import { usePackages } from "@/lib/contracts";
import { categoryLabel } from "@/lib/format";
import { backend, type PayLink, type PayLinkWithSales } from "@/lib/backend";
import { CheckIcon } from "./icons";

/** Formatea un string decimal de USDC como "1.234,50". */
function fmt(usdc: string | number | null | undefined): string {
  const n = Number(usdc ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-slate-800" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value} USDC</span>
    </div>
  );
}

/** Link copiable con botón "Copiar" y "Abrir". */
function LinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={url}
        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700"
      />
      <button onClick={copy} className="btn-primary shine shrink-0">
        {copied ? "¡Copiado! ✓" : "Copiar"}
      </button>
      <a href={url} target="_blank" rel="noreferrer" className="btn-accent shrink-0 grid place-items-center px-3">
        Abrir
      </a>
    </div>
  );
}

/**
 * RF-D02 — El agente genera un link de pago para un paquete, agregándole su
 * sobreprecio. El cliente paga `base + sobreprecio` por ese link; la base va al
 * escrow (reparto 85/12/3) y el sobreprecio se transfiere directo al agente.
 */
export function AgentPayLinkGenerator({ agent }: { agent: `0x${string}` }) {
  const { packages } = usePackages();
  const activos = useMemo(() => packages.filter((p) => p.active), [packages]);

  const [packageId, setPackageId] = useState<number | null>(null);
  const [surcharge, setSurcharge] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [links, setLinks] = useState<PayLinkWithSales[]>([]);
  const [justCreated, setJustCreated] = useState<PayLink | null>(null);

  useEffect(() => {
    if (packageId === null && activos.length > 0) setPackageId(activos[0].id);
  }, [activos, packageId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function loadLinks() {
    try {
      const res = await backend.get<{ links: PayLinkWithSales[] }>(
        `/api/paylinks?agent=${agent}`,
      );
      setLinks([...res.links].reverse());
    } catch {
      /* backend abajo: dejamos la lista como está */
    }
  }
  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const pkg = activos.find((p) => p.id === packageId);
  const base = pkg ? Number(pkg.price) / 1e6 : 0;
  const surchargeNum = Number(surcharge) || 0;
  const platformFee = base * 0.03;
  const agentBase = base * 0.12;
  const agentTotal = agentBase + surchargeNum;
  const final = base + surchargeNum;
  const surchargeValid = /^\d+(\.\d{1,6})?$/.test(surcharge || "0");

  async function generar() {
    if (!pkg || !surchargeValid) return;
    setCreating(true);
    setError(undefined);
    try {
      const link = await backend.post<PayLink>("/api/paylinks", {
        agent,
        packageId: pkg.id,
        surchargeUsdc: surcharge || "0",
        note,
      });
      setJustCreated(link);
      setSurcharge("");
      setNote("");
      await loadLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el link.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass animate-fade-in-up space-y-4 rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-semibold">Generar link de venta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Elegí un paquete y agregale tu sobreprecio. Se genera un link único que podés mandarle al
            cliente; cuando paga, la venta queda asociada a vos y cobrás{" "}
            <span className="font-semibold text-brand">12% del precio base + tu sobreprecio</span>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Paquete</span>
            <select
              value={packageId ?? ""}
              onChange={(e) => setPackageId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {activos.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} · {categoryLabel(p.category)} · {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sobreprecio (USDC)</span>
            <input
              inputMode="decimal"
              value={surcharge}
              onChange={(e) => setSurcharge(e.target.value.replace(",", "."))}
              placeholder="Ej: 150"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 ${
                surchargeValid ? "border-slate-200" : "border-red-300"
              }`}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Nota para el cliente (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Cata premium con traslado incluido"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>

        {/* Vista previa del desglose */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Vista previa
          </p>
          <div className="space-y-1">
            <Row label="Precio base del paquete" value={fmt(base)} />
            <Row label="Tu sobreprecio" value={fmt(surchargeNum)} />
            <div className="my-1 border-t border-slate-200" />
            <Row label="Precio final (paga el cliente)" value={fmt(final)} strong />
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>· Comisión plataforma (3% del base)</span>
                <span>{fmt(platformFee)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>· Tu comisión (12% del base + sobreprecio)</span>
                <span className="font-semibold text-brand">{fmt(agentTotal)} USDC</span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={generar}
          disabled={creating || !pkg || !surchargeValid}
          className="btn-primary shine w-full"
        >
          {creating ? "Generando…" : "Generar link de venta"}
        </button>
      </div>

      {justCreated && (
        <div className="glass animate-fade-in-up space-y-3 rounded-2xl border border-emerald-200 p-6">
          <p className="flex items-center gap-2 font-semibold text-emerald-700">
            <CheckIcon size={16} /> Link de venta creado · código {justCreated.code}
          </p>
          <LinkCopy url={`${origin}/pay/${justCreated.code}`} />
          <p className="text-xs text-slate-500">
            Mandale este link al cliente. Al abrirlo verá el paquete, el precio final y el detalle de
            comisiones, y podrá pagar en blockchain.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Mis links de venta</h2>
        {links.length === 0 ? (
          <p className="glass rounded-xl px-4 py-6 text-center text-sm text-slate-500">
            Todavía no generaste ningún link. Creá el primero arriba.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((l) => (
              <div key={l.code} className="glass card-hover space-y-2 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {l.package?.name ?? `Paquete #${l.packageId}`}{" "}
                    <span className="font-mono text-xs font-normal text-slate-400">· {l.code}</span>
                  </p>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                    {l.salesCount} {l.salesCount === 1 ? "venta" : "ventas"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Base {fmt(l.basePriceUsdc)} USDC</span>
                  <span>Sobreprecio {fmt(l.surchargeUsdc)} USDC</span>
                  <span className="font-medium text-slate-700">Final {fmt(l.finalPriceUsdc)} USDC</span>
                </div>
                <LinkCopy url={`${origin}/pay/${l.code}`} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
