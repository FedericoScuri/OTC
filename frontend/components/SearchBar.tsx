"use client";

import { MapPinIcon, CalendarIcon, UsersIcon, SearchIcon } from "./icons";

/**
 * Barra de búsqueda tipo sitio de reservas. El campo "Destino" filtra el
 * catálogo en vivo por nombre; "Fechas" y "Personas" son selectores de demo
 * (el contrato todavía no modela huéspedes ni rango de fechas de búsqueda).
 */
export function SearchBar({ query, onQuery }: { query: string; onQuery: (v: string) => void }) {
  return (
    <div className="flex flex-col items-stretch gap-1 rounded-2xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-900/5 sm:flex-row sm:items-center">
      <label className="flex flex-[1.4] items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50">
        <MapPinIcon size={17} className="shrink-0 text-brand" />
        <span className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Destino</span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscá un paquete…"
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
          />
        </span>
      </label>

      <div className="hidden w-px self-stretch bg-slate-100 sm:block" />

      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2">
        <CalendarIcon size={17} className="shrink-0 text-brand" />
        <span className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Fechas</span>
          <span className="text-sm font-medium text-slate-700">15 – 17 jul</span>
        </span>
      </div>

      <div className="hidden w-px self-stretch bg-slate-100 sm:block" />

      <div className="flex flex-[0.7] items-center gap-2 rounded-xl px-3 py-2">
        <UsersIcon size={17} className="shrink-0 text-brand" />
        <span className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Personas</span>
          <span className="text-sm font-medium text-slate-700">2</span>
        </span>
      </div>

      <button className="btn-accent shine shrink-0 sm:px-5" aria-label="Buscar">
        <SearchIcon size={17} />
        <span>Buscar</span>
      </button>
    </div>
  );
}
