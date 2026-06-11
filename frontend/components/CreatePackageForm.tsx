"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useContracts } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { CATEGORY_LABELS } from "@/lib/format";

/** Convierte un <input type="date"> (YYYY-MM-DD) a timestamp unix (segundos). */
function toUnix(date: string): bigint {
  return BigInt(Math.floor(new Date(`${date}T12:00:00`).getTime() / 1000));
}

/** Formulario para que un proveedor publique un paquete nuevo (RF-B02). */
export function CreatePackageForm({ onCreated }: { onCreated?: () => void }) {
  const { nft } = useContracts();
  const { run, pending, error } = useTx();

  const [category, setCategory] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [refundDeadline, setRefundDeadline] = useState("");
  const [supply, setSupply] = useState("");
  const [localError, setLocalError] = useState<string>();
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(undefined);
    setOk(false);

    if (!name.trim()) return setLocalError("Poné un nombre.");
    if (Number(price) <= 0) return setLocalError("El precio debe ser mayor a 0.");
    if (Number(supply) <= 0) return setLocalError("El cupo debe ser mayor a 0.");
    if (!checkIn || !checkOut || !refundDeadline)
      return setLocalError("Completá las tres fechas.");
    if (toUnix(checkOut) <= toUnix(checkIn))
      return setLocalError("El check-out debe ser posterior al check-in.");
    if (toUnix(refundDeadline) > toUnix(checkIn))
      return setLocalError("El límite de reembolso no puede ser posterior al check-in.");

    const done = await run(
      {
        ...nft,
        functionName: "createPackage",
        args: [
          category,
          name.trim(),
          parseUnits(price, 6),
          toUnix(checkIn),
          toUnix(checkOut),
          toUnix(refundDeadline),
          BigInt(supply),
        ],
      },
      () => {
        setOk(true);
        setName("");
        setPrice("");
        setSupply("");
        onCreated?.();
      },
    );
    if (!done) return;
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold">Publicar un paquete</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            className={inputClass}
          >
            {CATEGORY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cata premium en Bodega Mendoza"
            className={inputClass}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Precio unitario (USDC)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Cupo (unidades)</span>
          <input
            type="number"
            min="1"
            value={supply}
            onChange={(e) => setSupply(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Check-in</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Check-out</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-600">Reembolso total hasta</span>
          <input
            type="date"
            value={refundDeadline}
            onChange={(e) => setRefundDeadline(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {(localError || error) && <p className="text-sm text-red-600">{localError ?? error}</p>}
      {ok && <p className="text-sm text-emerald-600">✓ Paquete publicado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Publicando…" : "Publicar paquete"}
      </button>
    </form>
  );
}
