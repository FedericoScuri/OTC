"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { backend, type KybRecord } from "@/lib/backend";
import { CheckIcon } from "./icons";

/**
 * RF-A02 — KYC/KYB del proveedor. Muestra el estado del trámite y permite
 * enviarlo. Sin KYB verificado, el backend bloquea la publicación de inventario
 * (gate en /api/pms/sync). Para la demo incluye un botón de verificación admin.
 */
export function KybPanel({ provider }: { provider: Address }) {
  const [record, setRecord] = useState<KybRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({ legalName: "", taxId: "", country: "AR" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError(undefined);
    try {
      const r = await backend.get<KybRecord>(`/api/kyb/status/${provider}`);
      setRecord(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error consultando el KYB");
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      await backend.post("/api/kyb/submit", { provider, ...form });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el KYB");
    } finally {
      setBusy(false);
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      await backend.post("/api/kyb/decide", { provider, approve });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo resolver el KYB");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-2xl border border-slate-200/70 bg-white" />;
  }

  const status = record?.status ?? "NONE";

  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckIcon size={16} />
        <span>
          <strong>KYB verificado</strong> — {record?.legalName} ({record?.country}). Podés publicar
          inventario.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <h3 className="text-sm font-bold text-amber-900">
        Verificación KYB requerida (RF-A02)
      </h3>
      <p className="mt-0.5 text-xs text-amber-800">
        Un proveedor debe estar verificado antes de publicar inventario. Estado actual:{" "}
        <span className="font-semibold">{status}</span>.
      </p>

      {status === "PENDING" ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-amber-800">Trámite en revisión…</span>
          <button onClick={() => decide(true)} disabled={busy} className="btn-primary !py-1.5 text-xs">
            Verificar (admin demo)
          </button>
          <button
            onClick={() => decide(false)}
            disabled={busy}
            className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            Rechazar
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Razón social"
            value={form.legalName}
            onChange={(e) => setForm({ ...form, legalName: e.target.value })}
          />
          <input
            className="input"
            placeholder="CUIT / Tax ID"
            value={form.taxId}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          />
          <input
            className="input"
            placeholder="País (AR)"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <div className="sm:col-span-3">
            <button
              onClick={submit}
              disabled={busy || !form.legalName || !form.taxId || !form.country}
              className="btn-primary text-xs"
            >
              {busy ? "Enviando…" : "Enviar KYB"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
